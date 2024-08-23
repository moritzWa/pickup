import { MigrationInterface, QueryRunner } from "typeorm";

export class SnakeCase1724383227692 implements MigrationInterface {
    name = "SnakeCase1724383227692";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "skippedNotProbablyReadable" TO "skipped_not_probably_readable"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "skippedInaccessiblePDF" TO "skipped_inaccessible_pdf"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "skippedErrorFetchingFullText" TO "skipped_error_fetching_full_text"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "deadLink" TO "dead_link"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "couldntFetchThumbnail" TO "could_not_fetch_thumbnail"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "totalPagesIfPDF" TO "total_pages_if_pdf"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "fetchedPagesIfPDF" TO "fetched_pages_if_pdf"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "ogSiteName" TO "og_site_name"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "og_site_name"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "fetched_pages_if_pdf"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "total_pages_if_pdf"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "could_not_fetch_thumbnail"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "dead_link"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "skipped_error_fetching_full_text"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "skipped_inaccessible_pdf"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "skipped_not_probably_readable"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "ogSiteName" character varying`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "couldntFetchThumbnail" boolean`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "fetchedPagesIfPDF" integer`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "totalPagesIfPDF" integer`
        );
        await queryRunner.query(`ALTER TABLE "content" ADD "deadLink" boolean`);
        await queryRunner.query(
            `ALTER TABLE "content" ADD "skippedErrorFetchingFullText" boolean`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "skippedInaccessiblePDF" boolean`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "skippedNotProbablyReadable" boolean`
        );
    }
}
