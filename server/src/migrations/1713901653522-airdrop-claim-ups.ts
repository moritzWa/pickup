import { MigrationInterface, QueryRunner } from "typeorm";

export class airdropClaimUps1713901653522 implements MigrationInterface {
    name = "airdropClaimUps1713901653522";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD "chain" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD "transaction_hash" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."airdrop_claim_status_enum" RENAME TO "airdrop_claim_status_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."airdrop_claim_status_enum" AS ENUM('pending', 'claimed', 'succeeded')`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ALTER COLUMN "status" TYPE "public"."airdrop_claim_status_enum" USING "status"::"text"::"public"."airdrop_claim_status_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."airdrop_claim_status_enum_old"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."airdrop_claim_status_enum_old" AS ENUM('claimed', 'pending')`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ALTER COLUMN "status" TYPE "public"."airdrop_claim_status_enum_old" USING "status"::"text"::"public"."airdrop_claim_status_enum_old"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."airdrop_claim_status_enum"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."airdrop_claim_status_enum_old" RENAME TO "airdrop_claim_status_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP COLUMN "transaction_hash"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP COLUMN "chain"`
        );
    }
}
