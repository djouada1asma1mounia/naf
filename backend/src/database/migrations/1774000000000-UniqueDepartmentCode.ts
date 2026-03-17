import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueDepartmentCode1774000000000 implements MigrationInterface {
    name = 'UniqueDepartmentCode1774000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `departments` ADD UNIQUE INDEX `IDX_departments_code_unique` (`code`)"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `departments` DROP INDEX `IDX_departments_code_unique`"
        );
    }
}
