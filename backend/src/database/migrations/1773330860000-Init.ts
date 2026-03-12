import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773330860000 implements MigrationInterface {
    name = 'Init1773330860000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`departments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_8681da666ad9699d568b3e9106\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`departmentId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_554d853741f2083faaa5794d2ae\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_554d853741f2083faaa5794d2ae\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`departmentId\``);
        await queryRunner.query(`DROP INDEX \`IDX_8681da666ad9699d568b3e9106\` ON \`departments\``);
        await queryRunner.query(`DROP TABLE \`departments\``);
    }

}
