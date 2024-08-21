import { MigrationInterface, QueryRunner } from "typeorm";

export class WebsiteUniq1724213560850 implements MigrationInterface {
    name = "WebsiteUniq1724213560850";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // drop this index UQ_907928b9f7c8f1a98bb328c0d1c
        await queryRunner.query(
            `DROP INDEX IF EXISTS "UQ_907928b9f7c8f1a98bb328c0d1c"`
        );

        await queryRunner.query(
            `CREATE INDEX "content_website_unique_idx" ON "content" ("website_url") WHERE "type" = 'article'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."content_website_unique_idx"`
        );
    }
}
