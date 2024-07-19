import { MigrationInterface, QueryRunner } from "typeorm";

export class airdrops1713850851195 implements MigrationInterface {
    name = "airdrops1713850851195";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "airdrops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" text NOT NULL, "icon_image_url" text NOT NULL, "provider" text NOT NULL, "contract_address" text NOT NULL, "total_amount" numeric NOT NULL, "amount_per_claim" numeric NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_de9f9608d0eb4a76cf9ad80d4fa" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."airdrop_claim_status_enum" AS ENUM('pending', 'claimed')`
        );
        await queryRunner.query(
            `CREATE TABLE "airdrop_claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."airdrop_claim_status_enum" NOT NULL, "total_amount" numeric NOT NULL, "inviter_amount" numeric NOT NULL, "invited_amount" numeric NOT NULL, "code" text NOT NULL, "airdrop_id" uuid NOT NULL, "inviter_user_id" uuid NOT NULL, "invited_user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_bc19c630285e74818f843d711d4" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "airdrop_claims_code_idx" ON "airdrop_claims" ("code") `
        );
        await queryRunner.query(
            `CREATE INDEX "airdrop_claims_airdrop_id_idx" ON "airdrop_claims" ("airdrop_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "airdrop_claims_inviter_user_id_idx" ON "airdrop_claims" ("inviter_user_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "airdrop_claims_invited_user_id_idx" ON "airdrop_claims" ("invited_user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_c44486450f585ff7f59f0e2ef96" FOREIGN KEY ("inviter_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_dc3ad2a53ff312b9a816be02807" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_dc3ad2a53ff312b9a816be02807"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_c44486450f585ff7f59f0e2ef96"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."airdrop_claims_invited_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."airdrop_claims_inviter_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."airdrop_claims_airdrop_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."airdrop_claims_code_idx"`
        );
        await queryRunner.query(`DROP TABLE "airdrop_claims"`);
        await queryRunner.query(
            `DROP TYPE "public"."airdrop_claim_status_enum"`
        );
        await queryRunner.query(`DROP TABLE "airdrops"`);
    }
}
