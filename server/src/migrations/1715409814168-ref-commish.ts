import { MigrationInterface, QueryRunner } from "typeorm";

export class refCommish1715409814168 implements MigrationInterface {
    name = "refCommish1715409814168";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // drop swap_commissions table
        await queryRunner.query(`DROP TABLE "swap_commissions"`);
        await queryRunner.query(
            `CREATE TABLE "referral_commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chain" text NOT NULL, "hash" text NOT NULL, "estimated_swap_fiat_amount" numeric NOT NULL, "estimated_fee_fiat_amount_cents" numeric, "commission_fiat_amount_cents" numeric NOT NULL, "swap_id" uuid NOT NULL, "referral_id" uuid NOT NULL, "trader_user_id" uuid NOT NULL, "commission_recipient_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "referral_commissions_hash_chain_idx" UNIQUE ("hash", "chain"), CONSTRAINT "PK_ea91978c3fd0b7509e9456daecf" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "referral_payouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chain" text NOT NULL, "hash" text NOT NULL, "amount" numeric NOT NULL, "fiat_amount_cents" numeric NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_9b4ba98b66b035d28d0c83f47e4" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_ca05719aaf97569cab3ecd86d08" FOREIGN KEY ("trader_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_b7ece579a88e11c89b2f58059aa" FOREIGN KEY ("commission_recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" ADD CONSTRAINT "FK_74b5cebf4d54e8aba18c251d625" FOREIGN KEY ("swap_id") REFERENCES "swaps"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_74b5cebf4d54e8aba18c251d625"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_b7ece579a88e11c89b2f58059aa"`
        );
        await queryRunner.query(
            `ALTER TABLE "referral_commissions" DROP CONSTRAINT "FK_ca05719aaf97569cab3ecd86d08"`
        );
        await queryRunner.query(`DROP TABLE "referral_payouts"`);
        await queryRunner.query(`DROP TABLE "referral_commissions"`);
    }
}
