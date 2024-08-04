import { MigrationInterface, QueryRunner } from "typeorm";

export class MoreContent1722801464848 implements MigrationInterface {
    name = "MoreContent1722801464848";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" RENAME COLUMN "length_seconds" TO "length_ms"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "timestamp_cursor"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "current_ms" numeric`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "duration_ms" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
