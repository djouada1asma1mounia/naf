import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774288640197 implements MigrationInterface {
    name = 'Init1774288640197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` DROP FOREIGN KEY \`FK_f417b3a2e38339487716aa0742a\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\``);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD UNIQUE INDEX \`IDX_91fddbe23e927e1e525c152baa\` (\`code\`)`);
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` ADD CONSTRAINT \`FK_f417b3a2e38339487716aa0742a\` FOREIGN KEY (\`permissionsId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` DROP FOREIGN KEY \`FK_f417b3a2e38339487716aa0742a\``);
        await queryRunner.query(`ALTER TABLE \`departments\` DROP INDEX \`IDX_91fddbe23e927e1e525c152baa\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\` (\`managerId\`)`);
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` ADD CONSTRAINT \`FK_f417b3a2e38339487716aa0742a\` FOREIGN KEY (\`permissionsId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
