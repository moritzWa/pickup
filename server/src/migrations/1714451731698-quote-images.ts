import { MigrationInterface, QueryRunner } from "typeorm";

export class quoteImages1714451731698 implements MigrationInterface {
    name = "quoteImages1714451731698";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "send_icon_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "receive_icon_image_url" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "receive_icon_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "send_icon_image_url"`
        );
    }
}
