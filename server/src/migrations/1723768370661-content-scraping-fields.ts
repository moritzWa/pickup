import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723768370661 implements MigrationInterface {
    name = 'ContentScrapingFields1723768370661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "storedTextAsMarkdown"`);
        await queryRunner.query(`ALTER TABLE "content" ADD "totalPagesIfPDF" integer`);
        await queryRunner.query(`ALTER TABLE "content" ADD "fetchedPagesIfPDF" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "fetchedPagesIfPDF"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "totalPagesIfPDF"`);
        await queryRunner.query(`ALTER TABLE "content" ADD "storedTextAsMarkdown" boolean`);
    }

}
