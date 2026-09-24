import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateSortieToMateriels1694626800000 implements MigrationInterface {
  name = 'AddDateSortieToMateriels1694626800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE materiels ADD COLUMN dateSortie DATE NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE materiels DROP COLUMN dateSortie`);
  }
}
