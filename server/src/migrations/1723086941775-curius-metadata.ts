import { MigrationInterface, QueryRunner } from "typeorm";

export class CuriusMetadata1723086941775 implements MigrationInterface {
    name = 'CuriusMetadata1723086941775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "length" integer`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "excerpt" character varying`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "byline" character varying`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "dir" character varying`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "siteName" character varying`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "lang" character varying`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "publishedTime" character varying`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "totalPagesIfPDF" integer`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "fetchedPagesIfPDF" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "fetchedPagesIfPDF"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "totalPagesIfPDF"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "publishedTime"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "lang"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "siteName"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "dir"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "byline"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "excerpt"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "length"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "metadata" jsonb`);
    }

}
