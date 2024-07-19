import { MigrationInterface, QueryRunner } from "typeorm";

export class waitlistIdx1712176005583 implements MigrationInterface {
    name = "waitlistIdx1712176005583";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_referrals_referred_id_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_referrals_referrer_id_index"`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_users" ALTER COLUMN "phone_number" SET NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_referrals_referred_id_idx" ON "waitlist_referrals" ("referred_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_referrals_referrer_id_idx" ON "waitlist_referrals" ("referrer_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_referrals" ADD CONSTRAINT "waitlist_referrals_referrer_id_referred_id_unique_idx" UNIQUE ("referrer_id", "referred_id")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "waitlist_referrals" DROP CONSTRAINT "waitlist_referrals_referrer_id_referred_id_unique_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_referrals_referrer_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_referrals_referred_id_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_users" ALTER COLUMN "phone_number" DROP NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_referrals_referrer_id_index" ON "waitlist_referrals" ("referrer_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_referrals_referred_id_index" ON "waitlist_referrals" ("referred_id") `
        );
    }
}
