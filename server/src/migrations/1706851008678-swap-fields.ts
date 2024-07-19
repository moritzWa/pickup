import { MigrationInterface, QueryRunner } from "typeorm";

export class swapFields1706851008678 implements MigrationInterface {
    name = "swapFields1706851008678";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."swaps_send_asset_key_chain_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."swaps_receive_asset_key_chain_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "send_asset_key"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "receive_asset_key"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "send_token_contract_address" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "receive_token_contract_address" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "send_token_contract_address" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "receive_token_contract_address" text NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "receive_token_contract_address"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "send_token_contract_address"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "receive_symbol" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "send_asset_key" text NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_receive_asset_key_chain_idx" ON "swaps" ("chain", "receive_asset_key") `
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_send_asset_key_chain_idx" ON "swaps" ("chain", "send_asset_key") `
        );
    }
}
