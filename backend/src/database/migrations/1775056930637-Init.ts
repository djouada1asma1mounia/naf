import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775056930637 implements MigrationInterface {
    name = 'Init1775056930637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`services\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`departmentId\` int NOT NULL, UNIQUE INDEX \`IDX_866a53514f6940cc86576400db\` (\`departmentId\`, \`code\`), UNIQUE INDEX \`IDX_900cad62d637261bdf7295e874\` (\`departmentId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_9896dd19ab34a116cecf977836b\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_9896dd19ab34a116cecf977836b\``);
        await queryRunner.query(`DROP INDEX \`IDX_900cad62d637261bdf7295e874\` ON \`services\``);
        await queryRunner.query(`DROP INDEX \`IDX_866a53514f6940cc86576400db\` ON \`services\``);
        await queryRunner.query(`DROP TABLE \`services\``);
    }

}
