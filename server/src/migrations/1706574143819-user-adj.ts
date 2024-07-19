import { MigrationInterface, QueryRunner } from "typeorm";

export class userAdj1706574143819 implements MigrationInterface {
    name = "userAdj1706574143819";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "has_portfolio_enabled"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "has_trading_enabled"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "feature_flags"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."auth_provider_enum" RENAME TO "auth_provider_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."auth_provider_enum" AS ENUM('firebase', 'magic')`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "auth_provider" TYPE "public"."auth_provider_enum" USING "auth_provider"::"text"::"public"."auth_provider_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."auth_provider_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."auth_provider_enum_old" AS ENUM('firebase')`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "auth_provider" TYPE "public"."auth_provider_enum_old" USING "auth_provider"::"text"::"public"."auth_provider_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."auth_provider_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."auth_provider_enum_old" RENAME TO "auth_provider_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "feature_flags" jsonb`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "has_trading_enabled" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "has_portfolio_enabled" boolean NOT NULL DEFAULT false`
        );
    }
}
