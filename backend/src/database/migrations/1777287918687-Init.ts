import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777287918687 implements MigrationInterface {
    name = 'Init1777287918687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD \`utilisateur\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP COLUMN \`utilisateur\``);
    }

}
