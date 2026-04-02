import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775148663699 implements MigrationInterface {
    name = 'Init1775148663699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` MODIFY \`etat\` varchar(50) NOT NULL`);
        await queryRunner.query(`UPDATE \`materiels\` SET \`etat\` = 'En Service' WHERE \`etat\` = 'Active'`);
        await queryRunner.query(`UPDATE \`materiels\` SET \`etat\` = 'En Panne' WHERE LOWER(\`etat\`) = 'en panne'`);
        await queryRunner.query(`UPDATE \`materiels\` SET \`etat\` = 'Reforme' WHERE \`etat\` = 'en Maintenance'`);
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`etat\` \`etat\` enum ('En Service', 'En Panne', 'Reforme') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`materiels\` MODIFY \`etat\` varchar(50) NOT NULL`);
        await queryRunner.query(`UPDATE \`materiels\` SET \`etat\` = 'Active' WHERE \`etat\` = 'En Service'`);
        await queryRunner.query(`UPDATE \`materiels\` SET \`etat\` = 'en Panne' WHERE LOWER(\`etat\`) = 'en panne'`);
        await queryRunner.query(`UPDATE \`materiels\` SET \`etat\` = 'en Maintenance' WHERE \`etat\` = 'Reforme'`);
        await queryRunner.query(`ALTER TABLE \`materiels\` CHANGE \`etat\` \`etat\` enum ('Active', 'en Panne', 'en Maintenance') NOT NULL`);
    }

}
