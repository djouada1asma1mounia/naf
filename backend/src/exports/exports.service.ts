import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import {
    DataSource,
    EntityMetadata,
    EntityTarget,
    FindManyOptions,
    FindOptionsWhere,
    MoreThan,
} from 'typeorm';

@Injectable()
export class ExportsService {
    private readonly batchSize = 500;

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
