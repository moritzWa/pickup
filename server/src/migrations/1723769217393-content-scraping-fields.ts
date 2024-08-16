import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723769217393 implements MigrationInterface {
    name = 'ContentScrapingFields1723769217393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "content_as_markdown" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "content_as_markdown"`);
    }

}
