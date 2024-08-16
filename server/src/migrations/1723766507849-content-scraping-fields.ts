import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723766507849 implements MigrationInterface {
    name = 'ContentScrapingFields1723766507849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "storedTextAsMarkdown" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "storedTextAsMarkdown"`);
    }

}
