import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingFields1723845991527 implements MigrationInterface {
    name = 'ContentScrapingFields1723845991527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "couldntFetchThumbnail" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "couldntFetchThumbnail"`);
    }

}
