import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773764705792 implements MigrationInterface {
    name = 'Init1773764705792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\``);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD UNIQUE INDEX \`IDX_91fddbe23e927e1e525c152baa\` (\`code\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`departments\` DROP INDEX \`IDX_91fddbe23e927e1e525c152baa\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\` (\`managerId\`)`);
    }

}
