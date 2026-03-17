import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773763533252 implements MigrationInterface {
    name = 'Init1773763533252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`departments\` ADD \`code\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD \`managerId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD UNIQUE INDEX \`IDX_f6414ec030ca08823b25e03cd9\` (\`managerId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_f6414ec030ca08823b25e03cd9\` ON \`departments\` (\`managerId\`)`);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_f6414ec030ca08823b25e03cd9d\` FOREIGN KEY (\`managerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_f6414ec030ca08823b25e03cd9d\``);
        await queryRunner.query(`DROP INDEX \`REL_f6414ec030ca08823b25e03cd9\` ON \`departments\``);
        await queryRunner.query(`ALTER TABLE \`departments\` DROP INDEX \`IDX_f6414ec030ca08823b25e03cd9\``);
        await queryRunner.query(`ALTER TABLE \`departments\` DROP COLUMN \`managerId\``);
        await queryRunner.query(`ALTER TABLE \`departments\` DROP COLUMN \`code\``);
    }

}
