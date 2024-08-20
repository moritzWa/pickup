import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingLang1724116833822 implements MigrationInterface {
    name = "ContentScraping-Lang1724116833822";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "lang" character varying`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "lang"`);
    }
}
