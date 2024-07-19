import { MigrationInterface, QueryRunner } from "typeorm";

export class userFields1712892114209 implements MigrationInterface {
    name = "userFields1712892114209";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "wallets" jsonb`);
        await queryRunner.query(
            `ALTER TABLE "users" ADD "estimated_portfolio_value_cents" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "estimated_portfolio_value_cents"`
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "wallets"`);
    }
}
