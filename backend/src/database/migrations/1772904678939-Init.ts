import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772904678939 implements MigrationInterface {
    name = 'Init1772904678939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`refreshToken\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`refreshToken\``);
    }

}
