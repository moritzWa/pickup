import { MigrationInterface, QueryRunner } from "typeorm";

export class waitlistRevamp1712116542161 implements MigrationInterface {
    name = "waitlistRevamp1712116542161";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "waitlist_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "phone_number" text, "memecoin" text, "memecoin_image_url" text, "referral_code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_681f6b4e4cdda94c76897fd5c56" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "waitlist_users_phone_number_index" ON "waitlist_users" ("phone_number") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "waitlist_users_referral_code_idx" ON "waitlist_users" ("referral_code") `
        );
        await queryRunner.query(
            `CREATE TABLE "waitlist_referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referrer_id" uuid NOT NULL, "referred_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_f17199758e7b371b5fdd935a5e5" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_referrals_referred_id_index" ON "waitlist_referrals" ("referred_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_referrals_referrer_id_index" ON "waitlist_referrals" ("referrer_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_referrals" ADD CONSTRAINT "FK_f34cf349163369d7cd7c35586e6" FOREIGN KEY ("referred_id") REFERENCES "waitlist_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_referrals" ADD CONSTRAINT "FK_6adf00c02f416bb5ce922df3451" FOREIGN KEY ("referrer_id") REFERENCES "waitlist_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "waitlist_referrals" DROP CONSTRAINT "FK_6adf00c02f416bb5ce922df3451"`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_referrals" DROP CONSTRAINT "FK_f34cf349163369d7cd7c35586e6"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_referrals_referrer_id_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_referrals_referred_id_index"`
        );
        await queryRunner.query(`DROP TABLE "waitlist_referrals"`);
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_users_referral_code_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_users_phone_number_index"`
        );
        await queryRunner.query(`DROP TABLE "waitlist_users"`);
    }
}
