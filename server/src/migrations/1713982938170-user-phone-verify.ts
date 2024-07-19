import { MigrationInterface, QueryRunner } from "typeorm";

export class userPhoneVerify1713982938170 implements MigrationInterface {
    name = "userPhoneVerify1713982938170";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "has_verified_phone_number" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "users_phone_number_idx" ON "users" ("phone_number") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_phone_number_idx"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "has_verified_phone_number"`
        );
    }
}
