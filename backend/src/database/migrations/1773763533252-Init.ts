import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773763533252 implements MigrationInterface {
    name = 'Init1773763533252'

    private async hasIndex(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const table = await queryRunner.getTable(tableName);
        return table?.indices.some((index) => index.name === indexName) ?? false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCode = await queryRunner.hasColumn('departments', 'code');
        if (!hasCode) {
            await queryRunner.query(`ALTER TABLE \`departments\` ADD \`code\` varchar(255) NOT NULL`);
        }

        const hasManagerId = await queryRunner.hasColumn('departments', 'managerId');
        if (!hasManagerId) {
            await queryRunner.query(`ALTER TABLE \`departments\` ADD \`managerId\` varchar(36) NULL`);
        }

        const hasManagerIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_f6414ec030ca08823b25e03cd9');
        if (!hasManagerIdx) {
            await queryRunner.query(`ALTER TABLE \`departments\` ADD UNIQUE INDEX \`IDX_f6414ec030ca08823b25e03cd9\` (\`managerId\`)`);
        }

        const hasManagerRelIdx = await this.hasIndex(queryRunner, 'departments', 'REL_f6414ec030ca08823b25e03cd9');
        if (!hasManagerRelIdx) {
            await queryRunner.query(`CREATE UNIQUE INDEX \`REL_f6414ec030ca08823b25e03cd9\` ON \`departments\` (\`managerId\`)`);
        }

        const departmentsTable = await queryRunner.getTable('departments');
        const hasManagerFk = departmentsTable?.foreignKeys.some(
            (foreignKey) => foreignKey.name === 'FK_f6414ec030ca08823b25e03cd9d',
        );
        if (!hasManagerFk) {
            await queryRunner.query(`ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_f6414ec030ca08823b25e03cd9d\` FOREIGN KEY (\`managerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const departmentsTable = await queryRunner.getTable('departments');
        const hasManagerFk = departmentsTable?.foreignKeys.some(
            (foreignKey) => foreignKey.name === 'FK_f6414ec030ca08823b25e03cd9d',
        );
        if (hasManagerFk) {
            await queryRunner.query(`ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_f6414ec030ca08823b25e03cd9d\``);
        }

        const hasManagerRelIdx = await this.hasIndex(queryRunner, 'departments', 'REL_f6414ec030ca08823b25e03cd9');
        if (hasManagerRelIdx) {
            await queryRunner.query(`DROP INDEX \`REL_f6414ec030ca08823b25e03cd9\` ON \`departments\``);
        }

        const hasManagerIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_f6414ec030ca08823b25e03cd9');
        if (hasManagerIdx) {
            await queryRunner.query(`ALTER TABLE \`departments\` DROP INDEX \`IDX_f6414ec030ca08823b25e03cd9\``);
        }

        const hasManagerId = await queryRunner.hasColumn('departments', 'managerId');
        if (hasManagerId) {
            await queryRunner.query(`ALTER TABLE \`departments\` DROP COLUMN \`managerId\``);
        }

        const hasCode = await queryRunner.hasColumn('departments', 'code');
        if (hasCode) {
            await queryRunner.query(`ALTER TABLE \`departments\` DROP COLUMN \`code\``);
        }
    }

}
