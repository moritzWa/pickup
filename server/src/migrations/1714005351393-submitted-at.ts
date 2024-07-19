import { MigrationInterface, QueryRunner } from "typeorm";

export class submittedAt1714005351393 implements MigrationInterface {
    name = "submittedAt1714005351393";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD "submitted_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD "transaction_status" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP COLUMN "transaction_status"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP COLUMN "submitted_at"`
        );
    }
}
