import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775077428777 implements MigrationInterface {
    name = 'Init1775077428777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD \`subsidiaryCode\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_28c0b42d6618ad8b350761f712b\` FOREIGN KEY (\`subsidiaryCode\`) REFERENCES \`subsidiaries\`(\`code\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP FOREIGN KEY \`FK_28c0b42d6618ad8b350761f712b\``);
        await queryRunner.query(`ALTER TABLE \`materiels\` DROP COLUMN \`subsidiaryCode\``);
    }

}
