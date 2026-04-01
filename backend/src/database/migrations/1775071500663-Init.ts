import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775071500663 implements MigrationInterface {
    name = 'Init1775071500663'

    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
            [tableName, columnName],
        );
        return rows.length > 0;
    }

    private async indexExists(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
            [tableName, indexName],
        );
        return rows.length > 0;
    }

    private async dropForeignKeyOnColumnIfExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<void> {
        const rows: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(
            `
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND COLUMN_NAME = ?
              AND REFERENCED_TABLE_NAME IS NOT NULL
            `,
            [tableName, columnName],
        );

        for (const row of rows) {
            await queryRunner.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
        }
    }

    private async foreignKeyExists(queryRunner: QueryRunner, tableName: string, fkName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' LIMIT 1`,
            [tableName, fkName],
        );
        return rows.length > 0;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await this.columnExists(queryRunner, 'materiels', 'numeroInventaire'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD \`numeroInventaire\` varchar(255) NULL`);
        }

        await queryRunner.query(`UPDATE \`materiels\` SET \`numeroInventaire\` = \`numeroSerie\` WHERE \`numeroInventaire\` IS NULL OR \`numeroInventaire\` = ''`);
        await queryRunner.query(`ALTER TABLE \`materiels\` MODIFY \`numeroInventaire\` varchar(255) NOT NULL`);

        if (!(await this.indexExists(queryRunner, 'materiels', 'IDX_3019636f10e5cc05eb535178b4'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD UNIQUE INDEX \`IDX_3019636f10e5cc05eb535178b4\` (\`numeroInventaire\`)`);
        }

        if (!(await this.columnExists(queryRunner, 'materiels', 'serviceId'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD \`serviceId\` int NULL`);
        }

        const hasDepartmentId = await this.columnExists(queryRunner, 'materiels', 'departmentId');
        if (hasDepartmentId) {
            await queryRunner.query(`
                INSERT INTO \`services\` (\`name\`, \`code\`, \`departmentId\`)
                SELECT
                    CONCAT('Service auto D', d.id) AS name,
                    CONCAT('AUTO-D', d.id) AS code,
                    d.id AS departmentId
                FROM \`departments\` d
                INNER JOIN (SELECT DISTINCT departmentId FROM \`materiels\`) md ON md.departmentId = d.id
                LEFT JOIN \`services\` s ON s.departmentId = d.id
                WHERE s.id IS NULL
            `);

            await queryRunner.query(`
                UPDATE \`materiels\` m
                LEFT JOIN (
                    SELECT departmentId, MIN(id) AS serviceId
                    FROM \`services\`
                    GROUP BY departmentId
                ) s ON s.departmentId = m.departmentId
                SET m.serviceId = s.serviceId
                WHERE m.serviceId IS NULL
            `);
        } else {
            const nullServiceRows: Array<{ count: string }> = await queryRunner.query(
                `SELECT COUNT(*) AS count FROM \`materiels\` WHERE \`serviceId\` IS NULL`,
            );

            if (Number(nullServiceRows[0]?.count ?? 0) > 0) {
                const servicesCountRows: Array<{ count: string }> = await queryRunner.query(
                    `SELECT COUNT(*) AS count FROM \`services\``,
                );
                const servicesCount = Number(servicesCountRows[0]?.count ?? 0);

                if (servicesCount === 1) {
                    await queryRunner.query(`
                        UPDATE \`materiels\`
                        SET \`serviceId\` = (SELECT id FROM \`services\` ORDER BY id ASC LIMIT 1)
                        WHERE \`serviceId\` IS NULL
                    `);
                } else if (servicesCount > 1) {
                    await queryRunner.query(`
                        INSERT INTO \`services\` (\`name\`, \`code\`, \`departmentId\`)
                        SELECT
                            CONCAT('Service auto D', d.id) AS name,
                            CONCAT('AUTO-D', d.id) AS code,
                            d.id AS departmentId
                        FROM \`departments\` d
                        INNER JOIN (
                            SELECT DISTINCT u.departmentId
                            FROM \`materiels\` m
                            INNER JOIN \`users\` u ON u.id = m.proprietaireId
                            WHERE m.serviceId IS NULL AND u.departmentId IS NOT NULL
                        ) md ON md.departmentId = d.id
                        LEFT JOIN \`services\` s ON s.departmentId = d.id
                        WHERE s.id IS NULL
                    `);

                    await queryRunner.query(`
                        UPDATE \`materiels\` m
                        INNER JOIN \`users\` u ON u.id = m.proprietaireId
                        LEFT JOIN (
                            SELECT departmentId, MIN(id) AS serviceId
                            FROM \`services\`
                            GROUP BY departmentId
                        ) s ON s.departmentId = u.departmentId
                        SET m.serviceId = s.serviceId
                        WHERE m.serviceId IS NULL
                    `);

                    await queryRunner.query(`
                        INSERT INTO \`services\` (\`name\`, \`code\`, \`departmentId\`)
                        SELECT 'Service auto migration', 'AUTO-MIGRATION', d.id
                        FROM \`departments\` d
                        WHERE NOT EXISTS (
                            SELECT 1 FROM \`services\` s WHERE s.code = 'AUTO-MIGRATION'
                        )
                        ORDER BY d.id ASC
                        LIMIT 1
                    `);

                    await queryRunner.query(`
                        UPDATE \`materiels\`
                        SET \`serviceId\` = (SELECT id FROM \`services\` WHERE \`code\` = 'AUTO-MIGRATION' ORDER BY id DESC LIMIT 1)
                        WHERE \`serviceId\` IS NULL
                    `);
                } else if (servicesCount === 0) {
                    const departmentsCountRows: Array<{ count: string }> = await queryRunner.query(
                        `SELECT COUNT(*) AS count FROM \`departments\``,
                    );
                    const departmentsCount = Number(departmentsCountRows[0]?.count ?? 0);

                    if (departmentsCount === 1) {
                        await queryRunner.query(`
                            INSERT INTO \`services\` (\`name\`, \`code\`, \`departmentId\`)
                            SELECT 'Service auto migration', 'AUTO-MIGRATION', d.id
                            FROM \`departments\` d
                            ORDER BY d.id ASC
                            LIMIT 1
                        `);

                        await queryRunner.query(`
                            UPDATE \`materiels\`
                            SET \`serviceId\` = (SELECT id FROM \`services\` WHERE \`code\` = 'AUTO-MIGRATION' ORDER BY id DESC LIMIT 1)
                            WHERE \`serviceId\` IS NULL
                        `);
                    }
                }
            }
        }

        const missingServiceRows: Array<{ count: string }> = await queryRunner.query(
            `SELECT COUNT(*) AS count FROM \`materiels\` WHERE \`serviceId\` IS NULL`,
        );

        if (Number(missingServiceRows[0]?.count ?? 0) > 0) {
            throw new Error('Migration interrompue: certains matériels ne peuvent pas être rattachés à un service. Créez les services nécessaires puis relancez la migration.');
        }

        if (!(await this.foreignKeyExists(queryRunner, 'materiels', 'FK_963eff260cc4d6d9345cc9f1a0b'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_963eff260cc4d6d9345cc9f1a0b\` FOREIGN KEY (\`serviceId\`) REFERENCES \`services\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }

        await queryRunner.query(`ALTER TABLE \`materiels\` MODIFY \`serviceId\` int NOT NULL`);

        if (hasDepartmentId) {
            await this.dropForeignKeyOnColumnIfExists(queryRunner, 'materiels', 'departmentId');
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP COLUMN \`departmentId\``);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (!(await this.columnExists(queryRunner, 'materiels', 'departmentId'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD \`departmentId\` int NULL`);
        }

        await queryRunner.query(`
            UPDATE \`materiels\` m
            INNER JOIN \`services\` s ON s.id = m.serviceId
            SET m.departmentId = s.departmentId
            WHERE m.departmentId IS NULL
        `);

        const missingDepartmentRows: Array<{ count: string }> = await queryRunner.query(
            `SELECT COUNT(*) AS count FROM \`materiels\` WHERE \`departmentId\` IS NULL`,
        );

        if (Number(missingDepartmentRows[0]?.count ?? 0) > 0) {
            throw new Error('Rollback interrompu: certains matériels ne peuvent pas être rattachés à un département.');
        }

        await this.dropForeignKeyOnColumnIfExists(queryRunner, 'materiels', 'serviceId');

        if (await this.columnExists(queryRunner, 'materiels', 'serviceId')) {
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP COLUMN \`serviceId\``);
        }

        if (await this.indexExists(queryRunner, 'materiels', 'IDX_3019636f10e5cc05eb535178b4')) {
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP INDEX \`IDX_3019636f10e5cc05eb535178b4\``);
        }

        if (await this.columnExists(queryRunner, 'materiels', 'numeroInventaire')) {
            await queryRunner.query(`ALTER TABLE \`materiels\` DROP COLUMN \`numeroInventaire\``);
        }

        await queryRunner.query(`ALTER TABLE \`materiels\` MODIFY \`departmentId\` int NOT NULL`);

        if (!(await this.foreignKeyExists(queryRunner, 'materiels', 'FK_8c1c3b1f39e3aecb8e71cfa09a5'))) {
            await queryRunner.query(`ALTER TABLE \`materiels\` ADD CONSTRAINT \`FK_8c1c3b1f39e3aecb8e71cfa09a5\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

}
