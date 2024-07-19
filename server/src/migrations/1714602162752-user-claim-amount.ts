import { MigrationInterface, QueryRunner } from "typeorm";

export class userClaimAmount1714602162752 implements MigrationInterface {
    name = "userClaimAmount1714602162752";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "initial_deposit_token_symbol" text`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "initial_deposit_amount" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "initial_deposit_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "initial_deposit_token_symbol"`
        );
    }
}
