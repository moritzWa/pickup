import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenImages1718845964466 implements MigrationInterface {
    name = "tokenImages1718845964466";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "cdn_thumbnail_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "cdn_hero_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "cdn_original_image_url" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "cdn_original_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "cdn_hero_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "cdn_thumbnail_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "signed_setup_transaction_base58" text`
        );
    }
}
