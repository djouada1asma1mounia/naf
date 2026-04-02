import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775150265678 implements MigrationInterface {
    name = 'Init1775150265678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`decharge_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`designation\` varchar(255) NOT NULL, \`quantity\` int UNSIGNED NOT NULL, \`marque\` varchar(255) NULL, \`numeroSerie\` varchar(255) NULL, \`numeroInventaire\` varchar(255) NULL, \`dechargeId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`decharges\` (\`id\` int NOT NULL AUTO_INCREMENT, \`reference\` varchar(255) NOT NULL, \`maintenanceType\` enum ('HARD', 'SOFT') NOT NULL, \`observation\` text NULL, \`destinataire\` varchar(255) NOT NULL, \`receptionnaireNom\` varchar(255) NOT NULL, \`receptionnairePrenom\` varchar(255) NOT NULL, \`receptionnaireFonction\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdById\` varchar(36) NULL, UNIQUE INDEX \`IDX_11668d44169250ec06714e1308\` (\`reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        const itemFk = await queryRunner.query(`
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'decharge_items'
              AND CONSTRAINT_NAME = 'FK_aa2357e77157529e5a10630b71a'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        `);
        if (!itemFk.length) {
            await queryRunner.query(`ALTER TABLE \`decharge_items\` ADD CONSTRAINT \`FK_aa2357e77157529e5a10630b71a\` FOREIGN KEY (\`dechargeId\`) REFERENCES \`decharges\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        }

        const createdByFk = await queryRunner.query(`
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'decharges'
              AND CONSTRAINT_NAME = 'FK_b3d1bc95ae4975e6975415c76cd'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        `);
        if (!createdByFk.length) {
            await queryRunner.query(`ALTER TABLE \`decharges\` ADD CONSTRAINT \`FK_b3d1bc95ae4975e6975415c76cd\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decharges\` DROP FOREIGN KEY \`FK_b3d1bc95ae4975e6975415c76cd\``);
        await queryRunner.query(`ALTER TABLE \`decharge_items\` DROP FOREIGN KEY \`FK_aa2357e77157529e5a10630b71a\``);
        await queryRunner.query(`DROP INDEX \`IDX_11668d44169250ec06714e1308\` ON \`decharges\``);
        await queryRunner.query(`DROP TABLE \`decharges\``);
        await queryRunner.query(`DROP TABLE \`decharge_items\``);
    }

}
