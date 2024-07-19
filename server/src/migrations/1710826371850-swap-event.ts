import { MigrationInterface, QueryRunner } from "typeorm";

export class swapEvent1710826371850 implements MigrationInterface {
    name = "swapEvent1710826371850";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swap_events" DROP CONSTRAINT "swap_event_hash_chain_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ADD CONSTRAINT "swap_event_hash_status_chain_idx" UNIQUE ("hash", "status", "chain")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swap_events" DROP CONSTRAINT "swap_event_hash_status_chain_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ADD CONSTRAINT "swap_event_hash_chain_idx" UNIQUE ("chain", "hash")`
        );
    }
}
