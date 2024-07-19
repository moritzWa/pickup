import { MigrationInterface, QueryRunner } from "typeorm";

export class referralBonus1715388710300 implements MigrationInterface {
    name = "referralBonus1715388710300";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "referred_by_can_claim"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "referred_by_has_claimed"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "referred_by_free_credit_cents"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "referred_free_credit_cents"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "has_claimed_reward" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_token_symbol" text`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_deposit_amount" numeric`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_claimed_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "is_deposit_successful" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "reward_transaction_hash" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_transaction_hash"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "is_deposit_successful"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_claimed_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_deposit_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "reward_token_symbol"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "has_claimed_reward"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "referred_free_credit_cents" numeric NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "referred_by_free_credit_cents" numeric NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "referred_by_has_claimed" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "referred_by_can_claim" boolean NOT NULL DEFAULT false`
        );
    }
}
