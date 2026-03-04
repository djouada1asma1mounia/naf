import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772639552722 implements MigrationInterface {
    name = 'Init1772639552722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_48ce552495d14eae9b187bb671\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users_permissions_permissions\` (\`usersId\` varchar(36) NOT NULL, \`permissionsId\` int NOT NULL, INDEX \`IDX_b70d6dbde0e342b2afd199490c\` (\`usersId\`), INDEX \`IDX_f417b3a2e38339487716aa0742\` (\`permissionsId\`), PRIMARY KEY (\`usersId\`, \`permissionsId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` ADD CONSTRAINT \`FK_b70d6dbde0e342b2afd199490cc\` FOREIGN KEY (\`usersId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` ADD CONSTRAINT \`FK_f417b3a2e38339487716aa0742a\` FOREIGN KEY (\`permissionsId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` DROP FOREIGN KEY \`FK_f417b3a2e38339487716aa0742a\``);
        await queryRunner.query(`ALTER TABLE \`users_permissions_permissions\` DROP FOREIGN KEY \`FK_b70d6dbde0e342b2afd199490cc\``);
        await queryRunner.query(`DROP INDEX \`IDX_f417b3a2e38339487716aa0742\` ON \`users_permissions_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_b70d6dbde0e342b2afd199490c\` ON \`users_permissions_permissions\``);
        await queryRunner.query(`DROP TABLE \`users_permissions_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_48ce552495d14eae9b187bb671\` ON \`permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
    }

}
