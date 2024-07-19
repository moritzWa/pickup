import { MigrationInterface, QueryRunner } from "typeorm";

export class referralProgram1713063741095 implements MigrationInterface {
    name = "referralProgram1713063741095";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referred_by_can_claim" boolean NOT NULL DEFAULT false, "referred_by_has_claimed" boolean NOT NULL DEFAULT false, "referred_by_num_txns_free" numeric, "referred_by_free_credit_cents" numeric, "referred_user_id" uuid NOT NULL, "referred_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "referrals_pair_unique_idx" UNIQUE ("referred_by_user_id", "referred_user_id"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "referrals_referred_user_id_idx" ON "referrals" ("referred_user_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "referrals_referred_by_user_id_idx" ON "referrals" ("referred_by_user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "referral_code" text NOT NULL DEFAULT ''`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "available_credit_cents" numeric NOT NULL DEFAULT '0'`
        );
        await queryRunner.query(
            `CREATE INDEX "users_referral_code_idx" ON "users" ("referral_code") `
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_4f7e12bc95ee3fbef26068eb5c5" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_4f7e12bc95ee3fbef26068eb5c5"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."users_referral_code_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "available_credit_cents"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "referral_code"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."referrals_referred_by_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."referrals_referred_user_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "referrals"`);
    }
}
