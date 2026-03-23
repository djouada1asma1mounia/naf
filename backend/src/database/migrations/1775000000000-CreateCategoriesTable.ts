import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1775000000000 implements MigrationInterface {
    name = 'CreateCategoriesTable1775000000000'

    private async hasIndex(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const table = await queryRunner.getTable(tableName);
        return table?.indices.some((index) => index.name === indexName) ?? false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCategoriesTable = await queryRunner.hasTable('categories');
        if (!hasCategoriesTable) {
            await queryRunner.query(
                "CREATE TABLE `categories` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, UNIQUE INDEX `IDX_categories_name_unique` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasIndex = await this.hasIndex(queryRunner, 'categories', 'IDX_categories_name_unique');
        if (hasIndex) {
            await queryRunner.query("DROP INDEX `IDX_categories_name_unique` ON `categories`");
        }

        const hasCategoriesTable = await queryRunner.hasTable('categories');
        if (hasCategoriesTable) {
            await queryRunner.query("DROP TABLE `categories`");
        }
    }
}
