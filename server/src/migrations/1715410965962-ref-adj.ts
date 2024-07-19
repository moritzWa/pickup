import { MigrationInterface, QueryRunner } from "typeorm";

export class refAdj1715410965962 implements MigrationInterface {
    name = "refAdj1715410965962";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" ADD CONSTRAINT "FK_d8f3c4e6d2e2096c74a0b331be1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "referral_payouts" DROP CONSTRAINT "FK_d8f3c4e6d2e2096c74a0b331be1"`
        );
    }
}
