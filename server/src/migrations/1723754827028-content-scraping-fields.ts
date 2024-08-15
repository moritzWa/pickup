import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723754827028 implements MigrationInterface {
    name = 'ContentScrapingFields1723754827028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "full_text" text`);
        await queryRunner.query(`ALTER TABLE "content" ADD "excerpt" character varying`);
        await queryRunner.query(`ALTER TABLE "content" ADD "length" integer`);
        await queryRunner.query(`ALTER TABLE "content" ADD "skippedNotProbablyReadable" boolean`);
        await queryRunner.query(`ALTER TABLE "content" ADD "skippedInaccessiblePDF" boolean`);
        await queryRunner.query(`ALTER TABLE "content" ADD "skippedErrorFetchingFullText" boolean`);
        await queryRunner.query(`ALTER TABLE "content" ADD "deadLink" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "deadLink"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "skippedErrorFetchingFullText"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "skippedInaccessiblePDF"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "skippedNotProbablyReadable"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "length"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "excerpt"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "full_text"`);
    }

}
