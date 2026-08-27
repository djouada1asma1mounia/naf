import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777466190104 implements MigrationInterface {
    name = 'Init1777466190104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_04668611f9da2d214bb645a2f2e\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_28c0b42d6618ad8b350761f712b\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_04668611f9da2d214bb645a2f2e\` FOREIGN KEY (\`proprietaireId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_28c0b42d6618ad8b350761f712b\` FOREIGN KEY (\`subsidiaryCode\`) REFERENCES \`subsidiaries\`(\`code\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_28c0b42d6618ad8b350761f712b\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_04668611f9da2d214bb645a2f2e\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_28c0b42d6618ad8b350761f712b\` FOREIGN KEY (\`subsidiaryCode\`) REFERENCES \`subsidiaries\`(\`code\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_04668611f9da2d214bb645a2f2e\` FOREIGN KEY (\`proprietaireId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
