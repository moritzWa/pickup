import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentScrapingOgSitename1724118522694 implements MigrationInterface {
    name = 'ContentScrapingOgSitename1724118522694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "ogSiteName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "ogSiteName"`);
    }

}
