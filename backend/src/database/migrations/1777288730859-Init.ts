import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777288730859 implements MigrationInterface {
    name = 'Init1777288730859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`numeroInventaire\` \`numeroInventaire\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`numeroInventaire\` \`numeroInventaire\` varchar(255) NOT NULL`);
    }

}
