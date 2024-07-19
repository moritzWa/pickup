import { MigrationInterface, QueryRunner } from "typeorm";

export class userCanWithdraw1719188645671 implements MigrationInterface {
    name = "userCanWithdraw1719188645671";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "can_withdraw" boolean NOT NULL DEFAULT true`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "max_daily_withdrawals" numeric NOT NULL DEFAULT '3'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "max_daily_withdrawals"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "can_withdraw"`
        );
    }
}
