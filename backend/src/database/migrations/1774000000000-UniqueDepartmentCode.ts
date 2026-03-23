import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueDepartmentCode1774000000000 implements MigrationInterface {
    name = 'UniqueDepartmentCode1774000000000';

    private async hasIndex(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const table = await queryRunner.getTable(tableName);
        return table?.indices.some((index) => index.name === indexName) ?? false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const uniqueCodeIndexes = await queryRunner.query(
            "SHOW INDEX FROM `departments` WHERE `Column_name` = 'code' AND `Non_unique` = 0"
        );

        if (!Array.isArray(uniqueCodeIndexes) || uniqueCodeIndexes.length === 0) {
            await queryRunner.query(
                "ALTER TABLE `departments` ADD UNIQUE INDEX `IDX_departments_code_unique` (`code`)"
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasIndex = await this.hasIndex(queryRunner, 'departments', 'IDX_departments_code_unique');
        if (hasIndex) {
            await queryRunner.query(
                "ALTER TABLE `departments` DROP INDEX `IDX_departments_code_unique`"
            );
        }
    }
}
