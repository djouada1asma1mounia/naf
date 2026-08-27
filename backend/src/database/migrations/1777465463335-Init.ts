import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777465463335 implements MigrationInterface {
    name = 'Init1777465463335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_f6414ec030ca08823b25e03cd9d\``);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_f6414ec030ca08823b25e03cd9d\` FOREIGN KEY (\`managerId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_f6414ec030ca08823b25e03cd9d\``);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_f6414ec030ca08823b25e03cd9d\` FOREIGN KEY (\`managerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
