import { MigrationInterface, QueryRunner } from "typeorm";

export class referredFreeCreditCents1713125350364
    implements MigrationInterface
{
    name = "referredFreeCreditCents1713125350364";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "referred_free_credit_cents" numeric NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ALTER COLUMN "referred_by_free_credit_cents" SET NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" ALTER COLUMN "referred_by_free_credit_cents" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "referred_free_credit_cents"`
        );
    }
}
