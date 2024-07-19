import { MigrationInterface, QueryRunner } from "typeorm";

export class quoteAdj1706818882375 implements MigrationInterface {
    name = "quoteAdj1706818882375";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "send_icon_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "receive_icon_image_url"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "receive_icon_image_url" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "send_icon_image_url" text NOT NULL`
        );
    }
}
