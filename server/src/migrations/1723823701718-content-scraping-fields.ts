import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723823701718 implements MigrationInterface {
    name = "ContentScrapingFields1723823701718";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "og_description" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "og_description"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "og_description" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "og_description" TO "published_at"`
        );
    }
}
