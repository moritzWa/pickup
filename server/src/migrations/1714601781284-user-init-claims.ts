import { MigrationInterface, QueryRunner } from "typeorm";

export class userInitClaims1714601781284 implements MigrationInterface {
    name = "userInitClaims1714601781284";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "claimed_at"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "is_claim_successful"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "initial_deposit_claimed_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_initial_deposit_successful" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "initial_deposit_transaction_hash" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "initial_deposit_transaction_hash"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "is_initial_deposit_successful"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "initial_deposit_claimed_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_claim_successful" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "claimed_at" TIMESTAMP`
        );
    }
}
