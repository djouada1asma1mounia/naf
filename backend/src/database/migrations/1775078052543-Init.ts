import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775078052543 implements MigrationInterface {
    name = 'Init1775078052543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_963eff260cc4d6d9345cc9f1a0b\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`serviceId\` \`serviceId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_963eff260cc4d6d9345cc9f1a0b\` FOREIGN KEY (\`serviceId\`) REFERENCES \`services\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_963eff260cc4d6d9345cc9f1a0b\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`serviceId\` \`serviceId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_963eff260cc4d6d9345cc9f1a0b\` FOREIGN KEY (\`serviceId\`) REFERENCES \`services\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
