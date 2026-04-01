import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775073383762 implements MigrationInterface {
    name = 'Init1775073383762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`subsidiaries\` (\`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_02a78cf30080bf9b52e8f856cb\` (\`name\`), PRIMARY KEY (\`code\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_02a78cf30080bf9b52e8f856cb\` ON \`subsidiaries\``);
        await queryRunner.query(`DROP TABLE \`subsidiaries\``);
    }

}
