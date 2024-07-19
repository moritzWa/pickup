import { MigrationInterface, QueryRunner } from "typeorm";

export class userUnread1714070673571 implements MigrationInterface {
    name = "userUnread1714070673571";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "unread_count" numeric NOT NULL DEFAULT '0'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "unread_count"`
        );
    }
}
