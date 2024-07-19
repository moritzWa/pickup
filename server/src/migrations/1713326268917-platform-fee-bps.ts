import { MigrationInterface, QueryRunner } from "typeorm";

export class platformFeeBps1713326268917 implements MigrationInterface {
    name = "platformFeeBps1713326268917";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "platform_fee_bps" numeric`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "estimated_fee_value_cents" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "estimated_fee_value_cents"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "platform_fee_bps"`
        );
    }
}
