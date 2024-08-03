import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentFields1722646074635 implements MigrationInterface {
    name = "ContentFields1722646074635";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "source_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "percent_finished" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "percent_finished"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "source_image_url"`
        );
    }
}
