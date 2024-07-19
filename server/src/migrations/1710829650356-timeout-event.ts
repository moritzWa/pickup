import { MigrationInterface, QueryRunner } from "typeorm";

export class timeoutEvent1710829650356 implements MigrationInterface {
    name = "timeoutEvent1710829650356";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swap_events" DROP CONSTRAINT "swap_event_hash_status_chain_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ALTER COLUMN "hash" DROP NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swap_events" ALTER COLUMN "hash" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ADD CONSTRAINT "swap_event_hash_status_chain_idx" UNIQUE ("chain", "status", "hash")`
        );
    }
}
