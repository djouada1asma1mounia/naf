import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775077913372 implements MigrationInterface {
    name = 'Init1775077913372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_04668611f9da2d214bb645a2f2e\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`proprietaireId\` \`proprietaireId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_04668611f9da2d214bb645a2f2e\` FOREIGN KEY (\`proprietaireId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_04668611f9da2d214bb645a2f2e\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`proprietaireId\` \`proprietaireId\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_04668611f9da2d214bb645a2f2e\` FOREIGN KEY (\`proprietaireId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
