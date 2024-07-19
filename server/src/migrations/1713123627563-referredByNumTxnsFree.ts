import { MigrationInterface, QueryRunner } from "typeorm";

export class referredByNumTxnsFree1713123627563 implements MigrationInterface {
    name = "referredByNumTxnsFree1713123627563";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP COLUMN "referred_by_num_txns_free"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD "referred_by_num_txns_free" numeric`
        );
    }
}
