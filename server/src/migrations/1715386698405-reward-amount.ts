import { MigrationInterface, QueryRunner } from "typeorm";

export class rewardAmount1715386698405 implements MigrationInterface {
    name = "rewardAmount1715386698405";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "referral_reward_type" text NOT NULL DEFAULT 'flat_amount'`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "referral_reward_amount" numeric`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "referral_reward_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "referral_reward_type"`
        );
    }
}
