import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723755322441 implements MigrationInterface {
    name = 'ContentScrapingFields1723755322441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "full_text"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "full_text" text`);
    }

}
