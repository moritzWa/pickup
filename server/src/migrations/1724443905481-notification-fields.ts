import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationFields1724443905481 implements MigrationInterface {
    name = 'NotificationFields1724443905481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feed_items" ADD "insertion_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" text`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "follower_user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "feed_insertion_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "feed_insertion_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "follower_user_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "feed_items" DROP COLUMN "insertion_id"`);
    }

}
