import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775339092692 implements MigrationInterface {
    name = 'Init1775339092692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`intervention_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`designation\` varchar(255) NOT NULL, \`quantity\` int UNSIGNED NOT NULL, \`marque\` varchar(255) NULL, \`numeroSerie\` varchar(255) NULL, \`numeroInventaire\` varchar(255) NULL, \`interventionId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`interventions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`reference\` varchar(255) NOT NULL, \`interventionType\` enum ('HARD', 'SOFT') NOT NULL, \`observation\` text NULL, \`destinataire\` varchar(255) NOT NULL, \`interventionnaireNom\` varchar(255) NOT NULL, \`interventionnairePrenom\` varchar(255) NOT NULL, \`interventionnaireFonction\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdById\` varchar(36) NULL, UNIQUE INDEX \`IDX_25f5f10187d1bc491e74cabfc7\` (\`reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`intervention_items\` ADD CONSTRAINT \`FK_51d18a6bd2cbfc6e9c67dca954e\` FOREIGN KEY (\`interventionId\`) REFERENCES \`interventions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`interventions\` ADD CONSTRAINT \`FK_a0fc39ffa4583954a861909ddf4\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`interventions\` DROP FOREIGN KEY \`FK_a0fc39ffa4583954a861909ddf4\``);
        await queryRunner.query(`ALTER TABLE \`intervention_items\` DROP FOREIGN KEY \`FK_51d18a6bd2cbfc6e9c67dca954e\``);
        await queryRunner.query(`DROP INDEX \`IDX_25f5f10187d1bc491e74cabfc7\` ON \`interventions\``);
        await queryRunner.query(`DROP TABLE \`interventions\``);
        await queryRunner.query(`DROP TABLE \`intervention_items\``);
    }

}
