import { MigrationInterface, QueryRunner } from "typeorm";

export class QueuedAt1723652448660 implements MigrationInterface {
    name = "QueuedAt1723652448660";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feed_items" ADD "queued_at" TIMESTAMP`
        );
        await queryRunner.query(
            `CREATE INDEX "feed_item_queued_at_idx" ON "feed_items" ("queued_at", "user_id") WHERE is_queued = true`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."feed_item_queued_at_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "feed_items" DROP COLUMN "queued_at"`
        );
    }
}
