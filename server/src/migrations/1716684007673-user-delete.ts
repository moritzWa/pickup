import { MigrationInterface, QueryRunner } from "typeorm";

export class userDelete1716684007673 implements MigrationInterface {
    name = "userDelete1716684007673";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_7d50ef17f25bafbb1a6342c315b"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_4f7e12bc95ee3fbef26068eb5c5"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_dc3ad2a53ff312b9a816be02807"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_c44486450f585ff7f59f0e2ef96"`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6"`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP CONSTRAINT "FK_733c577e795f0f7f82f535c2cec"`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_552c0264daa625608bd03bc6838"`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ALTER COLUMN "user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" DROP CONSTRAINT "FK_7847be69c34cfeaf92c7852b019"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ALTER COLUMN "user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_ca05719aaf97569cab3ecd86d08"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_b7ece579a88e11c89b2f58059aa"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ALTER COLUMN "trader_user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ALTER COLUMN "commission_recipient_user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" DROP CONSTRAINT "FK_d8f3c4e6d2e2096c74a0b331be1"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" ALTER COLUMN "user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" DROP CONSTRAINT "FK_b5208a34b5d2e5f058332278120"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" ALTER COLUMN "swap_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ALTER COLUMN "inviter_user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_7d50ef17f25bafbb1a6342c315b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ADD CONSTRAINT "FK_7847be69c34cfeaf92c7852b019" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_ca05719aaf97569cab3ecd86d08" FOREIGN KEY ("trader_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_b7ece579a88e11c89b2f58059aa" FOREIGN KEY ("commission_recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" ADD CONSTRAINT "FK_d8f3c4e6d2e2096c74a0b331be1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" ADD CONSTRAINT "FK_b5208a34b5d2e5f058332278120" FOREIGN KEY ("swap_id") REFERENCES "swaps"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_4f7e12bc95ee3fbef26068eb5c5" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_c44486450f585ff7f59f0e2ef96" FOREIGN KEY ("inviter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_dc3ad2a53ff312b9a816be02807" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" ADD CONSTRAINT "FK_733c577e795f0f7f82f535c2cec" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" ADD CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_552c0264daa625608bd03bc6838" FOREIGN KEY ("follower_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_552c0264daa625608bd03bc6838"`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6"`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP CONSTRAINT "FK_733c577e795f0f7f82f535c2cec"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_dc3ad2a53ff312b9a816be02807"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_c44486450f585ff7f59f0e2ef96"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_4f7e12bc95ee3fbef26068eb5c5"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" DROP CONSTRAINT "FK_b5208a34b5d2e5f058332278120"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" DROP CONSTRAINT "FK_d8f3c4e6d2e2096c74a0b331be1"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_b7ece579a88e11c89b2f58059aa"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_ca05719aaf97569cab3ecd86d08"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" DROP CONSTRAINT "FK_7847be69c34cfeaf92c7852b019"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_7d50ef17f25bafbb1a6342c315b"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ALTER COLUMN "inviter_user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" ALTER COLUMN "swap_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_fees" ADD CONSTRAINT "FK_b5208a34b5d2e5f058332278120" FOREIGN KEY ("swap_id") REFERENCES "swaps"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" ALTER COLUMN "user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" ADD CONSTRAINT "FK_d8f3c4e6d2e2096c74a0b331be1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ALTER COLUMN "commission_recipient_user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ALTER COLUMN "trader_user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_b7ece579a88e11c89b2f58059aa" FOREIGN KEY ("commission_recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_ca05719aaf97569cab3ecd86d08" FOREIGN KEY ("trader_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ALTER COLUMN "user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ADD CONSTRAINT "FK_7847be69c34cfeaf92c7852b019" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ALTER COLUMN "user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_552c0264daa625608bd03bc6838" FOREIGN KEY ("follower_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" ADD CONSTRAINT "FK_733c577e795f0f7f82f535c2cec" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" ADD CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_c44486450f585ff7f59f0e2ef96" FOREIGN KEY ("inviter_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_dc3ad2a53ff312b9a816be02807" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_4f7e12bc95ee3fbef26068eb5c5" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_7d50ef17f25bafbb1a6342c315b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }
}
