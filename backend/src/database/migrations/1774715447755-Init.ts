import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774715447755 implements MigrationInterface {
    name = 'Init1774715447755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`materiels\` (\`numeroSerie\` varchar(255) NOT NULL, \`dateEntree\` date NULL, \`etat\` enum ('Active', 'en Panne', 'en Maintenance') NOT NULL, \`marque\` varchar(255) NULL, \`modele\` varchar(255) NULL, \`categorieId\` int NOT NULL, \`departmentId\` int NOT NULL, \`proprietaireId\` varchar(36) NOT NULL, PRIMARY KEY (\`numeroSerie\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_aeb6d2dcfe6cb5a5974c57718c0\` FOREIGN KEY (\`categorieId\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_8c1c3b1f39e3aecb8e71cfa09a5\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_04668611f9da2d214bb645a2f2e\` FOREIGN KEY (\`proprietaireId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_04668611f9da2d214bb645a2f2e\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_8c1c3b1f39e3aecb8e71cfa09a5\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_aeb6d2dcfe6cb5a5974c57718c0\``);
        await queryRunner.query(`DROP TABLE \`materiels\``);
    }

}
