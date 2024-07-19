import { MigrationInterface, QueryRunner } from "typeorm";

export class swapFeeAmount1714104533218 implements MigrationInterface {
    name = "swapFeeAmount1714104533218";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "estimated_fee_fiat_amount_cents" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "estimated_fee_fiat_amount_cents"`
        );
    }
}
