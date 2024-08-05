import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentSessionDates1722815936032 implements MigrationInterface {
    name = "ContentSessionDates1722815936032";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "bookmarked_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "last_listened_at" TIMESTAMP`
        );
        // index user_id + bookmarked_at descending on content_sessions
        await queryRunner.query(
            `CREATE INDEX "user_bookmarked_at_idx" ON "content_sessions" ("user_id", "bookmarked_at" DESC)`
        );
        // same but user_last_listened_at_idx
        await queryRunner.query(
            `CREATE INDEX "user_last_listened_at_idx" ON "content_sessions" ("user_id", "last_listened_at" DESC)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "last_listened_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "bookmarked_at"`
        );
    }
}
