import { MigrationInterface, QueryRunner } from "typeorm";

export class categoryName1715888567007 implements MigrationInterface {
    name = 'categoryName1715888567007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_entries" ADD "name" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_entries" DROP COLUMN "name"`);
    }

}
