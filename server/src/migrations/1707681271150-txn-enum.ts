import { MigrationInterface, QueryRunner } from "typeorm";

export class txnEnum1707681271150 implements MigrationInterface {
    name = "txnEnum1707681271150";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "recommended_slippage_bps" numeric`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."transaction_type_enum" AS ENUM('deposit', 'trade', 'failed')`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transaction_type_enum" USING "type"::"text"::"public"."transaction_type_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."transaction_type_enum_old"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."transaction_type_enum_old" AS ENUM('deposit', 'trade')`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transaction_type_enum_old" USING "type"::"text"::"public"."transaction_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."transaction_type_enum_old" RENAME TO "transaction_type_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "recommended_slippage_bps"`
        );
    }
}
