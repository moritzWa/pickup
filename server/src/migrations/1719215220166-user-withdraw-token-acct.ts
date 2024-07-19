import { MigrationInterface, QueryRunner } from "typeorm";

export class userWithdrawTokenAcct1719215220166 implements MigrationInterface {
    name = "userWithdrawTokenAcct1719215220166";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "can_withdraw_without_token_account" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "can_withdraw_without_token_account"`
        );
    }
}
