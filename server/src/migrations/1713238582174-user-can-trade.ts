import { MigrationInterface, QueryRunner } from "typeorm";

export class userCanTrade1713238582174 implements MigrationInterface {
    name = "userCanTrade1713238582174";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "can_trade_mobile" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "can_trade_mobile"`
        );
    }
}
