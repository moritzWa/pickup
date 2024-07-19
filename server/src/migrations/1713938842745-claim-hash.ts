import { MigrationInterface, QueryRunner } from "typeorm";

export class claimHash1713938842745 implements MigrationInterface {
    name = "claimHash1713938842745";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ALTER COLUMN "transaction_hash" DROP NOT NULL`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "airdrop_claims_transaction_hash_idx" ON "airdrop_claims" ("transaction_hash") `
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ADD CONSTRAINT "FK_5ba391935954f75517d645cacba" FOREIGN KEY ("airdrop_id") REFERENCES "airdrops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" DROP CONSTRAINT "FK_5ba391935954f75517d645cacba"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."airdrop_claims_transaction_hash_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "airdrop_claims" ALTER COLUMN "transaction_hash" SET NOT NULL`
        );
    }
}
