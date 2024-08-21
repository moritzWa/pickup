import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentWebsiteurlUnique1724208083797
    implements MigrationInterface
{
    name = "ContentWebsiteurlUnique1724208083797";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, remove related entries from content_authors table
        await queryRunner.query(`
            DELETE FROM content_authors
            WHERE content_id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY website_url ORDER BY created_at DESC) as row_num
                    FROM content
                ) t
                WHERE t.row_num > 1
            );
        `);

        // Then, remove duplicates from content table, keeping the latest entry
        await queryRunner.query(`
            DELETE FROM content
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY website_url ORDER BY created_at DESC) as row_num
                    FROM content
                ) t
                WHERE t.row_num > 1
            );
        `);

        // Now add the unique constraint
        await queryRunner.query(
            `ALTER TABLE "content" ADD CONSTRAINT "UQ_907928b9f7c8f1a98bb328c0d1c" UNIQUE ("website_url")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP CONSTRAINT "UQ_907928b9f7c8f1a98bb328c0d1c"`
        );
    }
}
