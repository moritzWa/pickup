import { MigrationInterface, QueryRunner } from "typeorm";

export class indexes1707288839332 implements MigrationInterface {
    name = "indexes1707288839332";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD "user_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_user_token_contract_address_provider_idx" ON "transfers" ("user_id", "token_contract_address", "provider") `
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_token_contract_address_provider_idx" ON "transfers" ("token_contract_address", "provider") `
        );
        await queryRunner.query(
            `CREATE INDEX "transaction_user_id_index" ON "transactions" ("user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "transaction_user_hash_idx" UNIQUE ("user_id", "hash")`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD CONSTRAINT "FK_ba27d1ebe999481ff98cfe51f6c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP CONSTRAINT "FK_ba27d1ebe999481ff98cfe51f6c"`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "transaction_user_hash_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transaction_user_id_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_token_contract_address_provider_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_user_token_contract_address_provider_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP COLUMN "user_id"`
        );
    }
}
