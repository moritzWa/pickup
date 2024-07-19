import { MigrationInterface, QueryRunner } from "typeorm";

export class userInitClaims1714599824355 implements MigrationInterface {
    name = "userInitClaims1714599824355";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "has_claimed_initial_deposit" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "claimed_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_claim_successful" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "is_claim_successful"`
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "claimed_at"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "has_claimed_initial_deposit"`
        );
    }
}
