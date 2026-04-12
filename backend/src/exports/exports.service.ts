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

        if (options.transactionMode === 'full') {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                for (const worksheet of workbook.worksheets) {
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
                identifier?: string;
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
                .filter((id): id is string => typeof id === 'string' && id.length > 0);

            const existingMap = new Map<string, object>();
            if (identifierColumn && updateIds.length > 0) {
                const existing = await repository.find({
                    where: {
                        [identifierColumn]: In(updateIds),
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
                if (parsed.identifier && identifierColumn) {
                    const existingEntity = existingMap.get(this.normalizeLookupKey(parsed.identifier));
                    if (!existingEntity) {
                        this.pushInvalidRow(
                            summary,
                            worksheet.name,
                            parsed.rowNumber,
                            [`enregistrement introuvable pour ${identifierColumn}=${parsed.identifier}`],
                        );
                        continue;
                    }

                    Object.assign(existingEntity, parsed.payload);
                    toUpdate.push({ rowNumber: parsed.rowNumber, entity: existingEntity });
                } else {
                    toCreate.push({
                        rowNumber: parsed.rowNumber,
                        entity: repository.create(parsed.payload),
                    });
                }
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
            this.pushInvalidRow(summary, sheetName, item.rowNumber, [
                `erreur de persistence: ${this.extractErrorMessage(error)}`,
            ]);
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
                payload[column.propertyName] = this.coerceScalarValue(rawValue, column.type);
            } catch (error) {
                rowErrors.push(`${column.propertyName}: ${(error as Error).message}`);
            }
        }

        for (const relation of relationColumns) {
            const lookup = relationLookups.get(relation.propertyName);
            if (!lookup) {
                continue;
            }

            const relationIdHeaders = relation.joinColumns
                .map((joinColumn) => joinColumn.propertyName)
                .filter((propertyName): propertyName is string => !!propertyName);

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
        if (headerMap.has('id')) {
            return 'id';
        }

        if (metadata.primaryColumns.length === 1) {
            return metadata.primaryColumns[0].propertyName;
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
            ? [configuredField]
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
                }
            }

            const possibleValues = candidateColumns
                .map((columnName) => this.toDisplayText(row[columnName]).trim())
                .filter((value) => value.length > 0);

            if (!configuredField && candidateColumns.includes('nom') && candidateColumns.includes('prenom')) {
                const nom = this.toDisplayText(row.nom).trim();
                const prenom = this.toDisplayText(row.prenom).trim();
                const fullName = [nom, prenom].filter((value) => value.length > 0).join(' ').trim();
                if (fullName.length > 0) {
                    possibleValues.push(fullName);
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
        const direct = lookup.idEntries.find((entry) => entry.normalizedId === normalizedId);
        if (direct) {
            return {
                ok: true,
                value: direct.keyPayload,
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
            error: `${relationName} not found by ${relationIdHeader}: '${idValue}' (normalized: '${normalizedId}')${candidates ? `, candidates: [${candidates}]` : ''
                }`,
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
        this.logger.debug(
            `[FK_LOOKUP] relation=${relationName} original='${token}' normalized='${normalizedToken}' keysSample=[${Array.from(lookup.map.keys()).slice(0, 10).join(', ')}]`,
        );

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

        return {
            ok: false,
            error: `${relationName} not found: '${token}' (normalized: '${normalizedToken}')${candidates ? `, candidates: [${candidates}]` : ''
                }`,
        };
    }

    private normalizeLookupKey(value: unknown): string {
        return this.normalizeText(this.toDisplayText(value));
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

    private coerceScalarValue(value: unknown, columnType: unknown): string | number | boolean {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (value instanceof Date) {
            const normalizedType = String(columnType ?? '').toLowerCase();
            if (normalizedType === 'date') {
                return value.toISOString().slice(0, 10);
            }
            return value.toISOString();
        }

        const text = this.toDisplayText(value).trim();
        if (text.length === 0) {
            return '';
        }

        const normalizedType = String(columnType ?? '').toLowerCase();
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
