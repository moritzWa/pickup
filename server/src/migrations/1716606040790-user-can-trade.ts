import { MigrationInterface, QueryRunner } from "typeorm";

export class userCanTrade1716606040790 implements MigrationInterface {
    name = "userCanTrade1716606040790";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "can_trade" boolean NOT NULL DEFAULT true`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_68b1d866de02dc337fa7972708"`
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "can_trade"`);
    }
}
