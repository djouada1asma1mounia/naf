import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import {
    DataSource,
    EntityManager,
    EntityMetadata,
    EntityTarget,
    FindManyOptions,
    FindOptionsWhere,
    In,
    MoreThan,
} from 'typeorm';

type ImportMode = 'error' | 'skip';
type TransactionMode = 'partial' | 'full';

type ImportOptions = {
    onMissingForeign: ImportMode;
    batchSize: number;
    transactionMode: TransactionMode;
    targetSheets?: string[];
};

type ImportSummary = {
    transactionMode: TransactionMode;
    rolledBack: boolean;
    validRowsProcessed: number;
    created: number;
    updated: number;
    failed: number;
    details: string[];
    invalidRows: Array<{
        sheet: string;
        row: number;
        errors: string[];
    }>;
};

type RelationLookup = {
    map: Map<string, Record<string, unknown>>;
    primaryKeys: string[];
    labels: Array<{
        original: string;
        normalized: string;
        keyPayload: Record<string, unknown>;
    }>;
    idEntries: Array<{
        normalizedId: string;
        keyPayload: Record<string, unknown>;
    }>;
};

type RelationResolveResult =
    | {
        ok: true;
        value: Record<string, unknown>;
    }
    | {
        ok: false;
        error: string;
    };

@Injectable()
export class ExportsService {
    private readonly batchSize = 500;
    private readonly logger = new Logger(ExportsService.name);
    private readonly enableLookupDebug =
        String(process.env.EXPORTS_LOOKUP_DEBUG ?? '').toLowerCase() === 'true';
    private readonly relationFieldConfig: Record<string, string> = {
        categorie: 'name',
        service: 'name',
        proprietaire: 'email',
        user: 'email',
        decharge: 'reference',
        intervention: 'reference',
    };

    constructor(private readonly dataSource: DataSource) { }

    async exportAllModelsToExcel(res: Response): Promise<void> {
        const fileName = `naftal-export-${new Date().toISOString().replace(/[.:]/g, '-')}.xlsx`;

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Naftal Backend';
        workbook.created = new Date();

        const entityMetadatas = this.dataSource.entityMetadatas
            .filter((metadata) => metadata.tableType !== 'view')
            .sort((a, b) => a.tableName.localeCompare(b.tableName));

        for (const metadata of entityMetadatas) {
            await this.writeEntityWorksheet(workbook, metadata);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
        res.setHeader('Content-Length', String(nodeBuffer.length));
        res.send(nodeBuffer);
    }

    async importAllModelsFromExcel(
        fileBuffer: Buffer,
        options: ImportOptions,
    ): Promise<ImportSummary> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any);

        const metadataMap = new Map<string, EntityMetadata>(
            this.dataSource.entityMetadatas
                .filter((metadata) => metadata.tableType !== 'view')
                .map((metadata) => [this.toWorksheetName(metadata.tableName), metadata]),
        );

        const summary: ImportSummary = {
            transactionMode: options.transactionMode,
            rolledBack: false,
            validRowsProcessed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            details: [],
            invalidRows: [],
        };
        const relationLookupCache = new Map<string, RelationLookup>();
        const targetSheetSet = this.buildTargetSheetSet(options.targetSheets);

        if (options.transactionMode === 'full') {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                for (const worksheet of workbook.worksheets) {
                    if (!this.shouldImportWorksheet(worksheet.name, targetSheetSet)) {
                        continue;
                    }

                    const metadata = metadataMap.get(worksheet.name);
                    if (!metadata) {
                        continue;
                    }

                    const sheetSummary = await this.importWorksheet(
                        worksheet,
                        metadata,
                        options,
                        relationLookupCache,
                        queryRunner.manager,
                    );
                    summary.created += sheetSummary.created;
                    summary.updated += sheetSummary.updated;
                    summary.validRowsProcessed += sheetSummary.validRowsProcessed;
                    summary.failed += sheetSummary.failed;
                    summary.details.push(...sheetSummary.details);
                    summary.invalidRows.push(...sheetSummary.invalidRows);
                }

                if (summary.failed > 0) {
                    await queryRunner.rollbackTransaction();
                    summary.rolledBack = true;
                    summary.created = 0;
                    summary.updated = 0;
                    summary.validRowsProcessed = 0;
                    summary.details.push(
                        'Mode full: rollback complet applique car au moins une ligne est invalide.',
                    );
                } else {
                    await queryRunner.commitTransaction();
                }
            } catch (error) {
                await queryRunner.rollbackTransaction();
                summary.rolledBack = true;
                summary.created = 0;
                summary.updated = 0;
                summary.validRowsProcessed = 0;
                summary.failed += 1;
                summary.details.push(`Erreur transaction full: ${this.extractErrorMessage(error)}`);
            } finally {
                await queryRunner.release();
            }
        } else {
            for (const worksheet of workbook.worksheets) {
                if (!this.shouldImportWorksheet(worksheet.name, targetSheetSet)) {
                    continue;
                }

                const metadata = metadataMap.get(worksheet.name);
                if (!metadata) {
                    continue;
                }

                const sheetSummary = await this.importWorksheet(
                    worksheet,
                    metadata,
                    options,
                    relationLookupCache,
                    this.dataSource.manager,
                );
                summary.created += sheetSummary.created;
                summary.updated += sheetSummary.updated;
                summary.validRowsProcessed += sheetSummary.validRowsProcessed;
                summary.failed += sheetSummary.failed;
                summary.details.push(...sheetSummary.details);
                summary.invalidRows.push(...sheetSummary.invalidRows);
            }
        }

        return summary;
    }

    private async writeEntityWorksheet(
        workbook: ExcelJS.Workbook,
        metadata: EntityMetadata,
    ): Promise<void> {
        const worksheetName = this.toWorksheetName(metadata.tableName);
        const worksheet = workbook.addWorksheet(worksheetName);

        const { scalarColumns, relationColumns } = this.getExportColumns(metadata);
        const header = [
            ...scalarColumns.map((column) => column.propertyName),
            ...relationColumns.map((relation) => relation.propertyName),
        ];

        worksheet.columns = header.map((name) => ({
            key: name,
            width: Math.min(Math.max(name.length + 4, 14), 45),
        }));
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        const headerRow = worksheet.addRow(header);
        headerRow.font = { bold: true };

        const target = metadata.target as EntityTarget<object>;
        const repository = this.dataSource.getRepository(target);
        const relationNames = metadata.relations.map((relation) => relation.propertyPath);

        const primaryColumns = metadata.primaryColumns;
        const canUseCursorPagination = primaryColumns.length === 1;

        if (canUseCursorPagination) {
            const primaryColumn = primaryColumns[0];
            let cursor: string | number | Date | undefined;

            while (true) {
                const where: FindOptionsWhere<object> | undefined =
                    cursor === undefined
                        ? undefined
                        : ({
                            [primaryColumn.propertyName]: MoreThan(cursor),
                        } as FindOptionsWhere<object>);

                const options: FindManyOptions<object> = {
                    where,
                    relations: relationNames,
                    order: {
                        [primaryColumn.propertyName]: 'ASC',
                    },
                    take: this.batchSize,
                    relationLoadStrategy: 'query',
                };

                const rows = await repository.find(options);
                if (rows.length === 0) {
                    break;
                }

                for (const row of rows) {
                    this.appendRow(worksheet, row, scalarColumns, relationColumns);
                }

                const lastRow = rows[rows.length - 1] as Record<string, unknown>;
                const nextCursor = lastRow[primaryColumn.propertyName];
                if (nextCursor === undefined || nextCursor === null) {
                    break;
                }

                cursor = nextCursor as string | number | Date;

                if (rows.length < this.batchSize) {
                    break;
                }
            }
        } else {
            let offset = 0;

            while (true) {
                const options: FindManyOptions<object> = {
                    relations: relationNames,
                    take: this.batchSize,
                    skip: offset,
                    relationLoadStrategy: 'query',
                };

                const rows = await repository.find(options);
                if (rows.length === 0) {
                    break;
                }

                for (const row of rows) {
                    this.appendRow(worksheet, row, scalarColumns, relationColumns);
                }

                offset += rows.length;
                if (rows.length < this.batchSize) {
                    break;
                }
            }
        }

    }

    private async importWorksheet(
        worksheet: ExcelJS.Worksheet,
        metadata: EntityMetadata,
        options: ImportOptions,
        relationLookupCache: Map<string, RelationLookup>,
        manager: EntityManager,
    ): Promise<ImportSummary> {
        const summary: ImportSummary = {
            transactionMode: options.transactionMode,
            rolledBack: false,
            validRowsProcessed: 0,
            created: 0,
            updated: 0,
            failed: 0,
            details: [],
            invalidRows: [],
        };

        const target = metadata.target as EntityTarget<object>;
        const repository = manager.getRepository(target);
        const { scalarColumns, relationColumns } = this.getExportColumns(metadata);
        const importableRelationColumns = relationColumns.filter(
            (relation) => relation.isManyToOne || relation.isOneToOneOwner || relation.isManyToMany,
        );

        const headerMap = this.readHeaderMap(worksheet);
        if (headerMap.size === 0) {
            return summary;
        }

        const identifierColumn = this.getIdentifierColumn(metadata, headerMap);
        const requiredColumns = this.getRequiredColumnsForCreate(metadata, scalarColumns);
        const requiredRelations = this.getRequiredRelationsForCreate(importableRelationColumns);

        const relationLookupEntries = await Promise.all(
            importableRelationColumns.map(async (relation) => {
                const lookup = await this.getOrBuildRelationLookup(
                    relation.propertyName,
                    relation.inverseEntityMetadata,
                    relationLookupCache,
                );
                return [relation.propertyName, lookup] as const;
            }),
        );
        const relationLookups = new Map<string, RelationLookup>(relationLookupEntries);

        const rowNumbers: number[] = [];
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const row = worksheet.getRow(rowNumber);
            if (this.rowHasValues(row, headerMap)) {
                rowNumbers.push(rowNumber);
            }
        }

        const batchSize = Math.max(1, options.batchSize || 200);

        for (let start = 0; start < rowNumbers.length; start += batchSize) {
            const batchRows = rowNumbers.slice(start, start + batchSize);
            const parsedRows: Array<{
                 rowNumber: number;
                 identifier?: string | number;
                 payload: Record<string, unknown>;
                    }> = [];

            for (const rowNumber of batchRows) {
                const row = worksheet.getRow(rowNumber);

                try {
                    const parsed = this.parseWorksheetRow({
                        worksheet,
                        row,
                        metadata,
                        scalarColumns,
                        relationColumns: importableRelationColumns,
                        headerMap,
                        relationLookups,
                        requiredColumns,
                        identifierColumn,
                        onMissingForeign: options.onMissingForeign,
                    });

                    if (!parsed) {
                        continue;
                    }

                    parsedRows.push({
                        rowNumber,
                        identifier: parsed.identifier,
                        payload: parsed.payload,
                    });
                } catch (error) {
                    const message = (error as Error).message;
                    this.pushInvalidRow(summary, worksheet.name, rowNumber, [message]);
                }
            }

             const updateIds = parsedRows
                .map((item) => item.identifier)
                .filter((id): id is string | number => id !== undefined && id !== null && String(id).trim() !== '');
          
              const existingMap = new Map<string, object>();
            if (identifierColumn && updateIds.length > 0) {
                const identifierColMeta = metadata.columns.find(
                    (col) => col.propertyName === identifierColumn,
                );

                // Safely convert string IDs to numbers if DB primary column is numeric
                const typedIds = updateIds.map((id) => {
                    if (
                        identifierColMeta &&
                        (identifierColMeta.type === Number ||
                            identifierColMeta.type === 'int' ||
                            identifierColMeta.type === 'bigint' ||
                            identifierColMeta.type === 'smallint' ||
                            identifierColMeta.type === 'tinyint')
                    ) {
                        const num = Number(id);
                        return !isNaN(num) ? num : id;
                    }
                    return id;
                });

                const existing = await repository.find({
                    where: {
                        [identifierColumn]: In(typedIds),
                    } as FindOptionsWhere<object>,
                    relationLoadStrategy: 'query',
                });

                for (const entity of existing) {
                    const record = entity as Record<string, unknown>;
                    const key = this.normalizeLookupKey(record[identifierColumn]);
                    if (key) {
                        existingMap.set(key, entity);
                    }
                }
            }

            const toCreate: Array<{ rowNumber: number; entity: object }> = [];
            const toUpdate: Array<{ rowNumber: number; entity: object }> = [];

            for (const parsed of parsedRows) {
                // Safe lookup ID fallback: check parsed.identifier first, or grab primary key directly from payload
                const targetCol = identifierColumn || metadata.primaryColumns[0]?.propertyName;
                const rawId = parsed.identifier ?? (targetCol ? parsed.payload[targetCol] : undefined);
                const lookupKey = rawId !== undefined && rawId !== null ? this.normalizeLookupKey(rawId) : null;

                const existingEntity = lookupKey ? existingMap.get(lookupKey) : undefined;

                if (existingEntity) {
                    Object.assign(existingEntity, parsed.payload);
                    toUpdate.push({ rowNumber: parsed.rowNumber, entity: existingEntity });
                    continue;
                }

                // Upsert behavior: if identifier is provided but no row exists in DB, create a new one.
                const createPayload: Record<string, unknown> = { ...parsed.payload };

                if (identifierColumn) {
                    const identifierMetadata = metadata.columns.find(
                        (column) => column.propertyName === identifierColumn,
                    );

                    if (
                        identifierMetadata
                        && !identifierMetadata.isGenerated
                        && createPayload[identifierColumn] === undefined
                        && rawId !== undefined
                    ) {
                        try {
                            createPayload[identifierColumn] = this.coerceScalarValue(
                                rawId,
                                identifierMetadata.type,
                                identifierMetadata,
                            );
                        } catch {
                            createPayload[identifierColumn] = rawId;
                        }
                    }
                }

                const missingRequired = requiredColumns
                    .filter((column) => {
                        const value = createPayload[column.propertyName];
                        return value === undefined || value === null || value === '';
                    })
                    .map((column) => column.propertyName);

                const missingRequiredRelations = requiredRelations
                    .filter((relation) => {
                        const value = createPayload[relation.propertyName];
                        return value === undefined || value === null || value === '';
                    })
                    .map((relation) => relation.propertyName);

                if (missingRequired.length > 0 || missingRequiredRelations.length > 0) {
                    const missingFields = [
                        ...missingRequired,
                        ...missingRequiredRelations,
                    ];
                    this.pushInvalidRow(
                        summary,
                        worksheet.name,
                        parsed.rowNumber,
                        [
                            `creation impossible: champs requis manquants (${missingFields.join(', ')})`,
                        ],
                    );
                    continue;
                }

                toCreate.push({
                    rowNumber: parsed.rowNumber,
                    entity: repository.create(createPayload),
                });
            }

            await this.persistImportBatch({
                repository,
                target,
                toCreate,
                toUpdate,
                summary,
                sheetName: worksheet.name,
                transactionMode: options.transactionMode,
            });
        }

        return summary;
    }

    private async persistImportBatch(params: {
        repository: ReturnType<EntityManager['getRepository']>;
        target: EntityTarget<object>;
        toCreate: Array<{ rowNumber: number; entity: object }>;
        toUpdate: Array<{ rowNumber: number; entity: object }>;
        summary: ImportSummary;
        sheetName: string;
        transactionMode: TransactionMode;
    }): Promise<void> {
        const {
            repository,
            target,
            toCreate,
            toUpdate,
            summary,
            sheetName,
            transactionMode,
        } = params;

        const createEntities = toCreate.map((item) => item.entity);
        const updateEntities = toUpdate.map((item) => item.entity);

        if (createEntities.length === 0 && updateEntities.length === 0) {
            return;
        }

        if (transactionMode === 'full') {
            try {
                if (createEntities.length > 0) {
                    await repository.save(createEntities);
                    summary.created += createEntities.length;
                    summary.validRowsProcessed += createEntities.length;
                }
                if (updateEntities.length > 0) {
                    await repository.save(updateEntities);
                    summary.updated += updateEntities.length;
                    summary.validRowsProcessed += updateEntities.length;
                }
            } catch (error) {
                for (const item of [...toCreate, ...toUpdate]) {
                    this.pushInvalidRow(summary, sheetName, item.rowNumber, [
                        `erreur de persistence (mode full): ${this.extractErrorMessage(error)}`,
                    ]);
                }
            }
            return;
        }

        try {
            await repository.manager.transaction(async (transactionalManager) => {
                const txRepo = transactionalManager.getRepository(target);
                if (createEntities.length > 0) {
                    await txRepo.save(createEntities);
                }
                if (updateEntities.length > 0) {
                    await txRepo.save(updateEntities);
                }
            });

            summary.created += createEntities.length;
            summary.updated += updateEntities.length;
            summary.validRowsProcessed += createEntities.length + updateEntities.length;
        } catch (error) {
            for (const item of toCreate) {
                await this.persistSingleRowPartial(
                    repository,
                    target,
                    item,
                    true,
                    summary,
                    sheetName,
                );
            }

            for (const item of toUpdate) {
                await this.persistSingleRowPartial(
                    repository,
                    target,
                    item,
                    false,
                    summary,
                    sheetName,
                );
            }
        }
    }

    private async persistSingleRowPartial(
        repository: ReturnType<EntityManager['getRepository']>,
        target: EntityTarget<object>,
        item: { rowNumber: number; entity: object },
        isCreate: boolean,
        summary: ImportSummary,
        sheetName: string,
    ): Promise<void> {
        try {
            await repository.manager.transaction(async (transactionalManager) => {
                const txRepo = transactionalManager.getRepository(target);
                await txRepo.save(item.entity);
            });

            if (isCreate) {
                summary.created += 1;
            } else {
                summary.updated += 1;
            }
            summary.validRowsProcessed += 1;
        } catch (error) {
            if (isCreate && this.isDuplicateConstraintError(error)) {
                const recovered = await this.tryRecoverCreateAsUpdate(
                    repository,
                    target,
                    item.entity,
                );

                if (recovered) {
                    summary.updated += 1;
                    summary.validRowsProcessed += 1;
                    summary.details.push(
                        `Sheet ${sheetName}, ligne ${item.rowNumber}: creation detectee en doublon, conversion en mise a jour automatique.`,
                    );
                    return;
                }
            }

            this.pushInvalidRow(summary, sheetName, item.rowNumber, [
                `erreur de persistence: ${this.extractErrorMessage(error)}`,
            ]);
        }
    }

    private isDuplicateConstraintError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const errorRecord = error as Record<string, unknown>;
        const code = String(errorRecord.code ?? '').toUpperCase();
        if (
            code === '23505'
            || code === 'ER_DUP_ENTRY'
            || code === 'SQLITE_CONSTRAINT'
            || code === 'SQLITE_CONSTRAINT_UNIQUE'
        ) {
            return true;
        }

        const message = this.extractErrorMessage(error).toLowerCase();
        return (
            message.includes('duplicate')
            || message.includes('already exists')
            || message.includes('unique constraint')
            || message.includes('violates unique')
        );
    }

    private async tryRecoverCreateAsUpdate(
        repository: ReturnType<EntityManager['getRepository']>,
        target: EntityTarget<object>,
        entity: object,
    ): Promise<boolean> {
        const entityRecord = entity as Record<string, unknown>;
        const primaryColumns = repository.metadata.primaryColumns;
        if (primaryColumns.length === 0) {
            return false;
        }

        const where: Record<string, unknown> = {};
        for (const column of primaryColumns) {
            const value = entityRecord[column.propertyName];
            if (value === undefined || value === null || value === '') {
                return false;
            }
            where[column.propertyName] = value;
        }

        try {
            let updated = false;
            await repository.manager.transaction(async (transactionalManager) => {
                const txRepo = transactionalManager.getRepository(target);
                const existing = await txRepo.findOne({
                    where: where as FindOptionsWhere<object>,
                });

                if (!existing) {
                    return;
                }

                Object.assign(existing as Record<string, unknown>, entityRecord);
                await txRepo.save(existing);
                updated = true;
            });

            return updated;
        } catch {
            return false;
        }
    }

    private parseWorksheetRow(params: {
        worksheet: ExcelJS.Worksheet;
        row: ExcelJS.Row;
        metadata: EntityMetadata;
        scalarColumns: Array<EntityMetadata['columns'][number]>;
        relationColumns: Array<EntityMetadata['relations'][number]>;
        headerMap: Map<string, number>;
        relationLookups: Map<string, RelationLookup>;
        requiredColumns: Array<EntityMetadata['columns'][number]>;
        identifierColumn?: string;
        onMissingForeign: ImportMode;
    }): { identifier?: string; payload: Record<string, unknown> } | null {
        const {
            worksheet,
            row,
            scalarColumns,
            relationColumns,
            headerMap,
            relationLookups,
            requiredColumns,
            identifierColumn,
            onMissingForeign,
        } = params;

        const payload: Record<string, unknown> = {};
        let identifier: string | undefined;
        const rowErrors: string[] = [];

        if (identifierColumn && headerMap.has(identifierColumn)) {
            const cellIndex = headerMap.get(identifierColumn)!;
            const identifierRaw = this.extractCellValue(row.getCell(cellIndex).value);
            const identifierText = this.toDisplayText(identifierRaw).trim();
            if (identifierText.length > 0) {
                identifier = identifierText;
            }
        }

        for (const column of scalarColumns) {
            const headerIndex = headerMap.get(column.propertyName);
            if (!headerIndex) {
                continue;
            }

            const rawValue = this.extractCellValue(row.getCell(headerIndex).value);
            if (rawValue === undefined || rawValue === null || rawValue === '') {
                continue;
            }

            try {
                payload[column.propertyName] = this.coerceScalarValue(rawValue, column.type, column);
            } catch (error) {
                rowErrors.push(`${column.propertyName}: ${(error as Error).message}`);
            }
        }

        for (const relation of relationColumns) {
            const lookup = relationLookups.get(relation.propertyName);
            if (!lookup) {
                continue;
            }

            const relationIdHeaders = Array.from(
                new Set(
                    relation.joinColumns
                        .flatMap((joinColumn) => [
                            joinColumn.propertyName,
                            joinColumn.databaseName,
                            `${relation.propertyName}Id`,
                        ])
                        .map((header) => String(header || '').trim())
                        .filter(
                            (header): header is string =>
                                header.length > 0 && header !== relation.propertyName,
                        ),
                ),
            );

            let idResolvedForRelation = false;
            let hasAnyIdInput = false;

            for (const relationIdHeader of relationIdHeaders) {
                const idHeaderIndex = headerMap.get(relationIdHeader);
                if (!idHeaderIndex) {
                    continue;
                }

                const idRaw = this.extractCellValue(row.getCell(idHeaderIndex).value);
                const idText = this.toDisplayText(idRaw).trim();
                if (!idText) {
                    continue;
                }

                hasAnyIdInput = true;
                const resolvedById = this.resolveLookupById(lookup, idText, relation.propertyName, relationIdHeader);
                if (!resolvedById.ok) {
                    if (this.shouldSkipMissingForeign(relation, onMissingForeign)) {
                        continue;
                    }
                    rowErrors.push(resolvedById.error);
                    break;
                }

                payload[relation.propertyName] = resolvedById.value;
                idResolvedForRelation = true;
                break;
            }

            if (idResolvedForRelation) {
                continue;
            }

            if (hasAnyIdInput) {
                continue;
            }

            const headerIndex = headerMap.get(relation.propertyName);
            if (!headerIndex) {
                continue;
            }

            const rawValue = this.extractCellValue(row.getCell(headerIndex).value);
            const relationText = this.toDisplayText(rawValue).trim();
            if (relationText.length === 0) {
                continue;
            }

            if (relation.isManyToMany) {
                const tokens = relationText
                    .split('|')
                    .map((token) => token.trim())
                    .filter((token) => token.length > 0);

                const resolvedValues: Record<string, unknown>[] = [];

                for (const token of tokens) {
                    const resolvedToken = this.resolveLookupToken(lookup, token, relation.propertyName);
                    if (!resolvedToken.ok) {
                        if (this.shouldSkipMissingForeign(relation, onMissingForeign)) {
                            continue;
                        }
                        rowErrors.push(resolvedToken.error);
                        continue;
                    }
                    resolvedValues.push(resolvedToken.value);
                }

                if (resolvedValues.length !== tokens.length) {
                    continue;
                }

                payload[relation.propertyName] = resolvedValues;
                continue;
            }

            const resolvedSingle = this.resolveLookupToken(lookup, relationText, relation.propertyName);
            if (!resolvedSingle.ok) {
                if (this.shouldSkipMissingForeign(relation, onMissingForeign)) {
                    continue;
                }
                rowErrors.push(resolvedSingle.error);
                continue;
            }

            payload[relation.propertyName] = resolvedSingle.value;
        }

        if (!identifier) {
            for (const requiredColumn of requiredColumns) {
                const value = payload[requiredColumn.propertyName];
                const isMissing = value === undefined || value === null || value === '';
                if (isMissing) {
                    rowErrors.push(`champ requis manquant: ${requiredColumn.propertyName}`);
                }
            }
        }

        if (rowErrors.length > 0) {
            throw new Error(rowErrors.join(' | '));
        }

        if (Object.keys(payload).length === 0) {
            return null;
        }

        return { identifier, payload };
    }

    private pushInvalidRow(
        summary: ImportSummary,
        sheet: string,
        row: number,
        errors: string[],
    ): void {
        summary.failed += 1;
        summary.invalidRows.push({
            sheet,
            row,
            errors,
        });
        summary.details.push(`Sheet ${sheet}, ligne ${row}: ${errors.join(' | ')}`);
    }

    private extractErrorMessage(error: unknown): string {
        if (!error) {
            return 'erreur inconnue';
        }

        if (error instanceof Error) {
            return error.message;
        }

        return String(error);
    }

    private readHeaderMap(worksheet: ExcelJS.Worksheet): Map<string, number> {
        const map = new Map<string, number>();
        const headerRow = worksheet.getRow(1);

        headerRow.eachCell((cell, colNumber) => {
            const raw = this.extractCellValue(cell.value);
            const header = this.toDisplayText(raw).trim();
            if (header.length > 0) {
                map.set(header, colNumber);
            }
        });

        return map;
    }

    private getIdentifierColumn(
    metadata: EntityMetadata,
    headerMap: Map<string, number>,
): string | undefined {
    // 1. Force primary key 'id' if it exists in entity columns
    const pkColumn = metadata.primaryColumns[0];
    if (pkColumn) {
        return pkColumn.propertyName; // Returns 'id'
    }

    // 2. Fallback to 'id' string if header has it
    if (headerMap.has('id')) {
        return 'id';
    }

    return undefined;
    }

    private getRequiredColumnsForCreate(
        metadata: EntityMetadata,
        scalarColumns: Array<EntityMetadata['columns'][number]>,
    ): Array<EntityMetadata['columns'][number]> {
        const primaryColumnProperties = new Set(
            metadata.primaryColumns.map((column) => column.propertyName),
        );

        return scalarColumns.filter((column) => {
            if (primaryColumnProperties.has(column.propertyName) && column.isGenerated) {
                return false;
            }

            if (column.isNullable) {
                return false;
            }

            if (column.default !== undefined && column.default !== null) {
                return false;
            }

            if (column.isCreateDate || column.isUpdateDate || column.isDeleteDate || column.isVersion) {
                return false;
            }

            if (column.isGenerated) {
                return false;
            }

            return true;
        });
    }

    private getRequiredRelationsForCreate(
        relationColumns: Array<EntityMetadata['relations'][number]>,
    ): Array<EntityMetadata['relations'][number]> {
        return relationColumns.filter((relation) => {
            if (!(relation.isManyToOne || relation.isOneToOneOwner)) {
                return false;
            }

            return relation.isNullable === false;
        });
    }

    private shouldSkipMissingForeign(
        relation: EntityMetadata['relations'][number],
        onMissingForeign: ImportMode,
    ): boolean {
        if (onMissingForeign !== 'skip') {
            return false;
        }

        if (relation.isManyToMany) {
            return true;
        }

        return relation.isNullable !== false;
    }

    private async buildRelationLookup(
        relationName: string,
        metadata: EntityMetadata,
    ): Promise<RelationLookup> {
        const target = metadata.target as EntityTarget<object>;
        const repository = this.dataSource.getRepository(target);
        const alias = 'rel';

        const primaryKeys = metadata.primaryColumns.map((column) => column.propertyName);
        const configuredField = this.relationFieldConfig[relationName];
        const defaultCandidates = ['name', 'title', 'label', 'nom', 'prenom', 'code', 'reference', 'email'];
        const lookupCandidateFields = configuredField
            ? Array.from(new Set([configuredField, ...defaultCandidates]))
            : defaultCandidates;

        const candidateColumns = lookupCandidateFields.filter((propertyName) =>
            metadata.columns.some((column) => column.propertyName === propertyName),
        );

        const selectColumns = [...new Set([...primaryKeys, ...candidateColumns])];
        const queryBuilder = repository.createQueryBuilder(alias).select([]);

        for (const propertyName of selectColumns) {
            queryBuilder.addSelect(`${alias}.${propertyName}`, propertyName);
        }

        const rows = await queryBuilder.getRawMany<Record<string, unknown>>();
        const map = new Map<string, Record<string, unknown>>();
        const labels: Array<{
            original: string;
            normalized: string;
            keyPayload: Record<string, unknown>;
        }> = [];
        const idEntries: Array<{
            normalizedId: string;
            keyPayload: Record<string, unknown>;
        }> = [];

        for (const row of rows) {
            const keyPayload: Record<string, unknown> = {};
            for (const pk of primaryKeys) {
                const pkValue = row[pk];
                if (pkValue !== undefined && pkValue !== null) {
                    keyPayload[pk] = pkValue;
                }
            }

            if (Object.keys(keyPayload).length === 0) {
                continue;
            }

            for (const pk of primaryKeys) {
              const pkValue = row[pk];
              const normalizedPkValue = this.normalizeLookupKey(pkValue);
              if (normalizedPkValue) {
                  idEntries.push({
                   normalizedId: normalizedPkValue,
                   keyPayload,
              });

        // FIX: Prefix ID lookup keys to avoid colliding with text labels (e.g., 'id:123')
        map.set(`id:${normalizedPkValue}`, keyPayload);
    }
}
            const possibleValues = candidateColumns
                .map((columnName) => this.toDisplayText(row[columnName]).trim())
                .filter((value) => value.length > 0);

            if (candidateColumns.includes('nom') && candidateColumns.includes('prenom')) {
                const nom = this.toDisplayText(row.nom).trim();
                const prenom = this.toDisplayText(row.prenom).trim();
                const fullName = [nom, prenom].filter((value) => value.length > 0).join(' ').trim();
                if (fullName.length > 0) {
                    possibleValues.push(fullName);
                }

                const reversedFullName = [prenom, nom]
                    .filter((value) => value.length > 0)
                    .join(' ')
                    .trim();
                if (reversedFullName.length > 0 && reversedFullName !== fullName) {
                    possibleValues.push(reversedFullName);
                }
            }

            for (const value of possibleValues) {
                const normalized = this.normalizeLookupKey(value);
                if (!normalized) {
                    continue;
                }

                map.set(normalized, keyPayload);
                labels.push({
                    original: value,
                    normalized,
                    keyPayload,
                });
            }
        }

        return {
            map,
            primaryKeys,
            labels,
            idEntries,
        };
    }

    private resolveLookupById(
        lookup: RelationLookup,
        idValue: string,
        relationName: string,
        relationIdHeader: string,
    ): RelationResolveResult {
        const normalizedId = this.normalizeLookupKey(idValue);
        
        const directFromMap = lookup.map.get(`id:${normalizedId}`);
        const directFromEntries = lookup.idEntries.find((entry) => entry.normalizedId === normalizedId)?.keyPayload;
        
        const keyPayload = directFromMap ?? directFromEntries;

        if (keyPayload) {
            return {
                ok: true,
                value: keyPayload,
            };
        }

        const candidates = lookup.labels
            .map((entry) => entry.original)
            .filter((value, index, array) => array.indexOf(value) === index)
            .slice(0, 5)
            .map((value) => `'${value}'`)
            .join(', ');

        return {
            ok: false,
            error: `${relationName} not found by ${relationIdHeader}: '${idValue}' (normalized: '${normalizedId}')${candidates ? `, candidates: [${candidates}]` : ''}`,
        };
    }

    private async getOrBuildRelationLookup(
        relationName: string,
        metadata: EntityMetadata,
        cache: Map<string, RelationLookup>,
    ): Promise<RelationLookup> {
        const cacheKey = `${relationName}:${metadata.tableName}:${metadata.primaryColumns
            .map((column) => column.propertyName)
            .join(',')}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const lookup = await this.buildRelationLookup(relationName, metadata);
        cache.set(cacheKey, lookup);
        return lookup;
    }

    private resolveLookupToken(
        lookup: RelationLookup,
        token: string,
        relationName: string,
    ): RelationResolveResult {
        const normalizedToken = this.normalizeLookupKey(token);

        if (!normalizedToken) {
            return {
                ok: false,
                error: `${relationName} not found: '${token}' (normalized: '${normalizedToken}')`,
            };
        }

        const direct = lookup.map.get(normalizedToken);
        if (direct) {
            return {
                ok: true,
                value: direct,
            };
        }

        const reversedToken = this.reverseTokenOrder(normalizedToken);
        if (reversedToken && reversedToken !== normalizedToken) {
            const reversedDirect = lookup.map.get(reversedToken);
            if (reversedDirect) {
                return {
                    ok: true,
                    value: reversedDirect,
                };
            }
        }

        const startsWithCandidates = lookup.labels.filter(
            (entry) => entry.normalized.startsWith(normalizedToken),
        );
        const includesCandidates = lookup.labels.filter(
            (entry) => entry.normalized.includes(normalizedToken),
        );

        const mergedCandidates = [...startsWithCandidates, ...includesCandidates].filter(
            (entry, index, array) => array.findIndex((candidate) => candidate.normalized === entry.normalized) === index,
        );

        if (mergedCandidates.length === 1) {
            return {
                ok: true,
                value: mergedCandidates[0].keyPayload,
            };
        }

        if (mergedCandidates.length > 1) {
            const ambiguousCandidates = mergedCandidates
                .slice(0, 10)
                .map((entry) => `'${entry.original}'`)
                .join(', ');

            if (this.enableLookupDebug) {
                this.logger.debug(
                    `[FK_LOOKUP] relation=${relationName} ambiguous original='${token}' normalized='${normalizedToken}' candidates=[${ambiguousCandidates}] keysSample=[${Array.from(lookup.map.keys()).slice(0, 10).join(', ')}]`,
                );
            }

            return {
                ok: false,
                error: `${relationName} ambiguous match: '${token}' (normalized: '${normalizedToken}'), candidates: [${ambiguousCandidates}]`,
            };
        }

        const candidates = lookup.labels
            .map((entry) => entry.original)
            .filter((value, index, array) => array.indexOf(value) === index)
            .slice(0, 5)
            .map((entry) => `'${entry}'`)
            .join(', ');

        if (this.enableLookupDebug) {
            this.logger.debug(
                `[FK_LOOKUP] relation=${relationName} miss original='${token}' normalized='${normalizedToken}' keysSample=[${Array.from(lookup.map.keys()).slice(0, 10).join(', ')}]`,
            );
        }

        return {
            ok: false,
            error: `${relationName} not found: '${token}' (normalized: '${normalizedToken}')${candidates ? `, candidates: [${candidates}]` : ''
                }`,
        };
    }

    private buildTargetSheetSet(targetSheets?: string[]): Set<string> {
        if (!Array.isArray(targetSheets) || targetSheets.length === 0) {
            return new Set<string>();
        }

        return new Set(
            targetSheets
                .map((sheet) => this.normalizeWorksheetName(sheet))
                .filter((sheet) => sheet.length > 0),
        );
    }

    private shouldImportWorksheet(worksheetName: string, targetSheetSet: Set<string>): boolean {
        if (targetSheetSet.size === 0) {
            return true;
        }

        return targetSheetSet.has(this.normalizeWorksheetName(worksheetName));
    }

    private normalizeWorksheetName(name: string): string {
        return this.toWorksheetName(String(name || '')).trim().toLowerCase();
    }

    private normalizeLookupKey(value: unknown): string {
        return this.normalizeText(this.toDisplayText(value));
    }

    private reverseTokenOrder(value: string): string {
    const tokens = value.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return value;
    }

    return tokens.reverse().join(' ');
}

    private normalizeText(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    private extractCellValue(value: ExcelJS.CellValue): unknown {
        if (value === null || value === undefined) {
            return undefined;
        }

        if (
            typeof value === 'string'
            || typeof value === 'number'
            || typeof value === 'boolean'
            || value instanceof Date
        ) {
            return value;
        }

        if (typeof value === 'object') {
            if ('result' in value && value.result !== undefined && value.result !== null) {
                return value.result;
            }

            if ('text' in value && value.text) {
                return value.text;
            }

            if ('richText' in value && Array.isArray(value.richText)) {
                return value.richText.map((part) => part.text).join('');
            }

            if ('hyperlink' in value && value.hyperlink) {
                return value.text ?? value.hyperlink;
            }
        }

        return undefined;
    }

    private rowHasValues(row: ExcelJS.Row, headerMap: Map<string, number>): boolean {
        for (const index of headerMap.values()) {
            const value = this.extractCellValue(row.getCell(index).value);
            const text = this.toDisplayText(value).trim();
            if (text.length > 0) {
                return true;
            }
        }

        return false;
    }

    private coerceScalarValue(
        value: unknown,
        columnType: unknown,
        columnMetadata?: EntityMetadata['columns'][number],
    ): string | number | boolean {
        const normalizedType = String(columnType ?? '').toLowerCase();

        const enumValues = Array.isArray(columnMetadata?.enum)
            ? columnMetadata.enum.map((enumValue) => String(enumValue))
            : [];

        if (enumValues.length > 0) {
            const input = this.toDisplayText(value).trim();
            if (!input) {
                return '';
            }

            const normalizedInput = this.normalizeText(input);
            const matched = enumValues.find(
                (enumValue) => this.normalizeText(enumValue) === normalizedInput,
            );

            if (!matched) {
                throw new Error(
                    `valeur invalide: ${input}. Valeurs attendues: ${enumValues.join(', ')}`,
                );
            }

            return matched;
        }

        if (value instanceof Date) {
            if (normalizedType === 'date') {
                return value.toISOString().slice(0, 10);
            }
            return value.toISOString();
        }

        if (typeof value === 'number') {
           // Replace numeric date parsing inside coerceScalarValue:

                if (['date', 'datetime', 'timestamp'].includes(normalizedType)) {
                // FIX: Explicitly handle Excel date epoch conversion accurately in UTC
                const excelEpochUtc = Date.UTC(1899, 11, 30);
                const millisPerDay = 24 * 60 * 60 * 1000;
                
                // Account for Excel leap year bug adjustment if serial number > 60
                const adjustedValue = value > 60 ? value - 1 : value; 
                const parsed = new Date(excelEpochUtc + Math.round(adjustedValue * millisPerDay));

                if (Number.isNaN(parsed.getTime())) {
                    throw new Error(`date invalide: ${value}`);
                }
                if (normalizedType === 'date') {
                    return parsed.toISOString().slice(0, 10);
                }
                return parsed.toISOString();
            }

            if (['int', 'integer', 'bigint', 'float', 'double', 'decimal', 'numeric', 'real'].includes(normalizedType)) {
                return value;
            }

            if (['bool', 'boolean', 'bit'].includes(normalizedType)) {
                if (value === 1) {
                    return true;
                }
                if (value === 0) {
                    return false;
                }
                throw new Error(`valeur booléenne invalide: ${value}`);
            }

            return String(value);
        }

        if (typeof value === 'boolean') {
            if (['bool', 'boolean', 'bit'].includes(normalizedType)) {
                return value;
            }
            return String(value);
        }

        const text = this.toDisplayText(value).trim();
        if (text.length === 0) {
            return '';
        }

        if (['int', 'integer', 'bigint', 'float', 'double', 'decimal', 'numeric', 'real'].includes(normalizedType)) {
            const parsed = Number(text);
            if (!Number.isFinite(parsed)) {
                throw new Error(`valeur numérique invalide: ${text}`);
            }
            return parsed;
        }

        if (['bool', 'boolean', 'bit'].includes(normalizedType)) {
            const normalized = text.toLowerCase();
            if (['true', '1', 'yes', 'oui'].includes(normalized)) {
                return true;
            }
            if (['false', '0', 'no', 'non'].includes(normalized)) {
                return false;
            }
            throw new Error(`valeur booléenne invalide: ${text}`);
        }

        if (['date', 'datetime', 'timestamp'].includes(normalizedType)) {
            const parsed = new Date(text);
            if (Number.isNaN(parsed.getTime())) {
                throw new Error(`date invalide: ${text}`);
            }
            if (normalizedType === 'date') {
                return parsed.toISOString().slice(0, 10);
            }
            return parsed.toISOString();
        }

        return text;
    }

    private appendRow(
        worksheet: ExcelJS.Worksheet,
        row: object,
        scalarColumns: Array<EntityMetadata['columns'][number]>,
        relationColumns: Array<EntityMetadata['relations'][number]>,
    ): void {
        const source = row as Record<string, unknown>;

        const scalarValues = scalarColumns.map((column) =>
            this.serializeCellValue(source[column.propertyName]),
        );

        const relationValues = relationColumns.map((relation) => {
            const relationValue = source[relation.propertyName];
            const relationPrimaryKeys = relation.inverseEntityMetadata.primaryColumns.map(
                (column) => column.propertyName,
            );

            return this.serializeRelationReference(relationValue, relationPrimaryKeys);
        });

        worksheet.addRow([...scalarValues, ...relationValues]);
    }

    private serializeRelationReference(
        relationValue: unknown,
        primaryKeys: string[],
    ): string {
        if (relationValue === undefined || relationValue === null) {
            return '';
        }

        if (Array.isArray(relationValue)) {
            return relationValue
                .map((item) => this.serializeRelationReference(item, primaryKeys))
                .filter((value) => value.length > 0)
                .join(' | ');
        }

        if (typeof relationValue !== 'object') {
            return this.serializePrimitiveLike(relationValue);
        }

        const relationRecord = relationValue as Record<string, unknown>;
        const preferredFields = ['name', 'title', 'label', 'nom', 'code', 'reference', 'email'];

        if (relationRecord.nom !== undefined || relationRecord.prenom !== undefined) {
            const nom = this.toDisplayText(relationRecord.nom);
            const prenom = this.toDisplayText(relationRecord.prenom);
            const fullName = [nom, prenom].filter((value) => value.length > 0).join(' ').trim();
            if (fullName.length > 0) {
                return fullName;
            }
        }

        for (const field of preferredFields) {
            const candidate = relationRecord[field];
            if (candidate !== undefined && candidate !== null) {
                const serialized = this.toDisplayText(candidate);
                if (serialized.length > 0) {
                    return serialized;
                }
            }
        }

        const nonIdPrimaryKeys = primaryKeys.filter((key) => key.toLowerCase() !== 'id');
        for (const key of nonIdPrimaryKeys) {
            const candidate = relationRecord[key];
            const serialized = this.toDisplayText(candidate);
            if (serialized.length > 0) {
                return serialized;
            }
        }

        return '';
    }

    private getExportColumns(metadata: EntityMetadata): {
        scalarColumns: Array<EntityMetadata['columns'][number]>;
        relationColumns: Array<EntityMetadata['relations'][number]>;
    } {
        const primaryColumnProperties = new Set(
            metadata.primaryColumns.map((column) => column.propertyName),
        );

        const relationIdProperties = new Set(
            metadata.relations.flatMap((relation) =>
                relation.joinColumns
                    .map((joinColumn) => joinColumn.propertyName)
                    .filter((propertyName): propertyName is string => !!propertyName),
            ),
        );

        const primaryColumns = metadata.columns.filter((column) =>
            primaryColumnProperties.has(column.propertyName),
        );

        const nonPrimaryColumns = metadata.columns.filter((column) => {
            if (primaryColumnProperties.has(column.propertyName)) {
                return false;
            }

            if (relationIdProperties.has(column.propertyName)) {
                return false;
            }

            if (column.propertyName.toLowerCase().endsWith('id')) {
                return false;
            }

            return true;
        });

        return {
            scalarColumns: [...primaryColumns, ...nonPrimaryColumns],
            relationColumns: metadata.relations,
        };
    }

    private toDisplayText(value: unknown): string {
        if (value === undefined || value === null) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (
            typeof value === 'string'
            || typeof value === 'number'
            || typeof value === 'boolean'
        ) {
            return String(value);
        }

        return '';
    }

    private serializeCellValue(value: unknown): string | number | boolean {
        if (value === undefined || value === null) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }

        if (Array.isArray(value)) {
            return this.safeStringify(value);
        }

        if (typeof value === 'object') {
            return this.safeStringify(value);
        }

        return String(value);
    }

    private serializePrimitiveLike(value: unknown): string {
        if (value === undefined || value === null) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (typeof value === 'object') {
            return this.safeStringify(value);
        }

        return String(value);
    }

    private safeStringify(value: unknown): string {
        const seen = new WeakSet<object>();

        try {
            return JSON.stringify(value, (_key, currentValue) => {
                if (currentValue instanceof Date) {
                    return currentValue.toISOString();
                }

                if (typeof currentValue === 'bigint') {
                    return currentValue.toString();
                }

                if (currentValue && typeof currentValue === 'object') {
                    if (seen.has(currentValue as object)) {
                        return '[Circular]';
                    }
                    seen.add(currentValue as object);
                }

                return currentValue;
            }) ?? '';
        } catch {
            return '';
        }
    }

    private toWorksheetName(name: string): string {
        return name.replace(/[\\/*?:\[\]]/g, '_').slice(0, 31);
    }
}
