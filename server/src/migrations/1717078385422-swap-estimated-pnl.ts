import { MigrationInterface, QueryRunner } from "typeorm";

export class swapEstimatedPnl1717078385422 implements MigrationInterface {
    name = "swapEstimatedPnl1717078385422";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "estimated_pnl_fiat_amount" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "estimated_pnl_fiat_amount"`
        );
    }
}
