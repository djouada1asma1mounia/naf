import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773764705792 implements MigrationInterface {
    name = 'Init1773764705792'

    private async hasIndex(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const table = await queryRunner.getTable(tableName);
        return table?.indices.some((index) => index.name === indexName) ?? false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasManagerIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_f6414ec030ca08823b25e03cd9');
        if (hasManagerIdx) {
            await queryRunner.query(`DROP INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\``);
        }

        const hasCodeIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_91fddbe23e927e1e525c152baa');
        if (!hasCodeIdx) {
            await queryRunner.query(`ALTER TABLE \`departments\` ADD UNIQUE INDEX \`IDX_91fddbe23e927e1e525c152baa\` (\`code\`)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCodeIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_91fddbe23e927e1e525c152baa');
        if (hasCodeIdx) {
            await queryRunner.query(`ALTER TABLE \`departments\` DROP INDEX \`IDX_91fddbe23e927e1e525c152baa\``);
        }

        const hasManagerIdx = await this.hasIndex(queryRunner, 'departments', 'IDX_f6414ec030ca08823b25e03cd9');
        if (!hasManagerIdx) {
            await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_f6414ec030ca08823b25e03cd9\` ON \`departments\` (\`managerId\`)`);
        }
    }

}
