import { MigrationInterface, QueryRunner } from "typeorm";

export class TextCrallMetadata1723090080747 implements MigrationInterface {
    name = 'TextCrallMetadata1723090080747'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "skippedNotProbablyReadable" boolean`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "skippedInaccessiblePDF" boolean`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "skippedErrorFetchingFullText" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "skippedErrorFetchingFullText"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "skippedInaccessiblePDF"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "skippedNotProbablyReadable"`);
    }

}
