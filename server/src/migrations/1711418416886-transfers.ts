import { MigrationInterface, QueryRunner } from "typeorm";

export class transfers1711418416886 implements MigrationInterface {
    name = "transfers1711418416886";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD "fiat_amount_cents" numeric`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD "has_looked_up_fiat_amount" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP COLUMN "has_looked_up_fiat_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP COLUMN "fiat_amount_cents"`
        );
    }
}
