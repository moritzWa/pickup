import { MigrationInterface, QueryRunner } from "typeorm";

export class swapCommission1715405217106 implements MigrationInterface {
    name = "swapCommission1715405217106";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "swap_commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "public"."trading_provider_enum", "chain" text NOT NULL, "hash" text NOT NULL, "estimated_swap_fiat_amount" numeric NOT NULL, "estimated_fee_fiat_amount_cents" numeric, "swap_id" uuid NOT NULL, "trader_user_id" uuid NOT NULL, "commission_recipient_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "swap_commissions_hash_chain_idx" UNIQUE ("hash", "chain"), CONSTRAINT "PK_3022d59f592379fd25eefe71ded" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "swap_fees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chain" text NOT NULL, "hash" text NOT NULL, "estimated_swap_fiat_amount" numeric NOT NULL, "estimated_fee_fiat_amount_cents" numeric, "estimated_fee_fiat_amount_revenue_cents" numeric, "swap_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "swaps_fees_hash_chain_idx" UNIQUE ("hash", "chain"), CONSTRAINT "PK_88337d5ae1e7c89cc8d4724e3d8" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_deposit_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_amount" numeric`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_token_contract_address" text`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_token_icon_image_url" text`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_commissions" ADD CONSTRAINT "FK_50ff2d302bba77a0e7cf4ec86d2" FOREIGN KEY ("trader_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_commissions" ADD CONSTRAINT "FK_3c8f65cb4eab42b57792e942ec9" FOREIGN KEY ("commission_recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_commissions" ADD CONSTRAINT "FK_101a4f87c9e0d91c028fbf2d8b5" FOREIGN KEY ("swap_id") REFERENCES "swaps"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" ADD CONSTRAINT "FK_b5208a34b5d2e5f058332278120" FOREIGN KEY ("swap_id") REFERENCES "swaps"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swap_fees" DROP CONSTRAINT "FK_b5208a34b5d2e5f058332278120"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_commissions" DROP CONSTRAINT "FK_101a4f87c9e0d91c028fbf2d8b5"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_commissions" DROP CONSTRAINT "FK_3c8f65cb4eab42b57792e942ec9"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_commissions" DROP CONSTRAINT "FK_50ff2d302bba77a0e7cf4ec86d2"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_token_icon_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_token_contract_address"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_deposit_amount" numeric`
        );
        await queryRunner.query(`DROP TABLE "swap_fees"`);
        await queryRunner.query(`DROP TABLE "swap_commissions"`);
    }
}
