import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775071742217 implements MigrationInterface {
    name = 'Init1775071742217'

    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
            [tableName, columnName],
        );
        return rows.length > 0;
    }

    private async indexExists(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
            [tableName, indexName],
        );
        return rows.length > 0;
    }

    private async foreignKeyExists(queryRunner: QueryRunner, tableName: string, fkName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' LIMIT 1`,
            [tableName, fkName],
        );
        return rows.length > 0;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await this.columnExists(queryRunner, 'materiels', 'serviceId'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD \`serviceId\` int NOT NULL`);
        }

        if (!(await this.indexExists(queryRunner, 'materiels', 'IDX_3019636f10e5cc05eb535178b4'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD UNIQUE INDEX \`IDX_3019636f10e5cc05eb535178b4\` (\`numeroInventaire\`)`);
        }

        if (!(await this.foreignKeyExists(queryRunner, 'materiels', 'FK_963eff260cc4d6d9345cc9f1a0b'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_963eff260cc4d6d9345cc9f1a0b\` FOREIGN KEY (\`serviceId\`) REFERENCES \`services\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await this.foreignKeyExists(queryRunner, 'materiels', 'FK_963eff260cc4d6d9345cc9f1a0b')) {
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_963eff260cc4d6d9345cc9f1a0b\``);
        }

        if (await this.indexExists(queryRunner, 'materiels', 'IDX_3019636f10e5cc05eb535178b4')) {
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP INDEX \`IDX_3019636f10e5cc05eb535178b4\``);
        }

        if (await this.columnExists(queryRunner, 'materiels', 'serviceId')) {
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP COLUMN \`serviceId\``);
        }
    }

}
