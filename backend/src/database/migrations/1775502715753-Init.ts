import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775502715753 implements MigrationInterface {
    name = 'Init1775502715753'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`interventions\` ADD \`status\` enum ('A_FAIRE', 'EN_COURS', 'TERMINE') NOT NULL DEFAULT 'A_FAIRE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`interventions\` DROP COLUMN \`status\``);
    }

}
