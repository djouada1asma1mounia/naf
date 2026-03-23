import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774292499441 implements MigrationInterface {
    name = 'Init1774292499441'

    private async hasIndex(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const table = await queryRunner.getTable(tableName);
        return table?.indices.some((index) => index.name === indexName) ?? false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const uppTable = await queryRunner.getTable('users_permissions_permissions');
        const hasPermissionFk = uppTable?.foreignKeys.some(
            (foreignKey) => foreignKey.name === 'FK_f417b3a2e38339487716aa0742a',
        );
        if (hasPermissionFk) {
            await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` DROP FOREIGN KEY \`FK_f417b3a2e38339487716aa0742a\``);
        }

        const hasManagerIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_f6414ec030ca08823b25e03cd9');
        if (hasManagerIdx) {
            await queryRunner.query(`DROP INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\``);
        }

        const hasCategoriesTable = await queryRunner.hasTable('categories');
        if (!hasCategoriesTable) {
            await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_8b0be371d28245da6e4f4b6187\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        }

        const hasCodeIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_91fddbe23e927e1e525c152baa');
        if (!hasCodeIdx) {
            await queryRunner.query(`ALTER TABLE \`departments\` ADD UNIQUE INDEX \`IDX_91fddbe23e927e1e525c152baa\` (\`code\`)`);
        }

        const uppTableAfter = await queryRunner.getTable('users_permissions_permissions');
        const hasPermissionFkAfter = uppTableAfter?.foreignKeys.some(
            (foreignKey) => foreignKey.name === 'FK_f417b3a2e38339487716aa0742a',
        );
        if (!hasPermissionFkAfter) {
            await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` ADD CONSTRAINT \`FK_f417b3a2e38339487716aa0742a\` FOREIGN KEY (\`permissionsId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const uppTable = await queryRunner.getTable('users_permissions_permissions');
        const hasPermissionFk = uppTable?.foreignKeys.some(
            (foreignKey) => foreignKey.name === 'FK_f417b3a2e38339487716aa0742a',
        );
        if (hasPermissionFk) {
            await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` DROP FOREIGN KEY \`FK_f417b3a2e38339487716aa0742a\``);
        }

        const hasCodeIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_91fddbe23e927e1e525c152baa');
        if (hasCodeIdx) {
            await queryRunner.query(`ALTER TABLE \`departments\` DROP INDEX \`IDX_91fddbe23e927e1e525c152baa\``);
        }

        const hasCategoryIdx = await this.hasIndex(queryRunner, 'categories', 'IDX_8b0be371d28245da6e4f4b6187');
        if (hasCategoryIdx) {
            await queryRunner.query(`DROP INDEX \`IDX_8b0be371d28245da6e4f4b6187\` ON \`categories\``);
        }

        const hasCategoriesTable = await queryRunner.hasTable('categories');
        if (hasCategoriesTable) {
            await queryRunner.query(`DROP TABLE \`categories\``);
        }

        const hasManagerIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_f6414ec030ca08823b25e03cd9');
        if (!hasManagerIdx) {
            await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\` (\`managerId\`)`);
        }

        const uppTableAfter = await queryRunner.getTable('users_permissions_permissions');
        const hasPermissionFkAfter = uppTableAfter?.foreignKeys.some(
            (foreignKey) => foreignKey.name === 'FK_f417b3a2e38339487716aa0742a',
        );
        if (!hasPermissionFkAfter) {
            await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` ADD CONSTRAINT \`FK_f417b3a2e38339487716aa0742a\` FOREIGN KEY (\`permissionsId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        }
    }

}
