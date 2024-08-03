import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentThumbnail1722644337902 implements MigrationInterface {
    name = "ContentThumbnail1722644337902";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "thumbnail_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "length_seconds" SET NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "length_seconds" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "thumbnail_image_url"`
        );
    }
}
