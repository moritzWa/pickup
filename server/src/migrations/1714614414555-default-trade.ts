import { MigrationInterface, QueryRunner } from "typeorm";

export class defaultTrade1714614414555 implements MigrationInterface {
    name = 'defaultTrade1714614414555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "can_trade_mobile" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "can_trade_mobile" SET DEFAULT false`);
    }

}
