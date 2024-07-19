import { MigrationInterface, QueryRunner } from "typeorm";

export class swapImages1714451643091 implements MigrationInterface {
    name = "swapImages1714451643091";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "send_icon_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "receive_icon_image_url" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "receive_icon_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "send_icon_image_url"`
        );
    }
}
