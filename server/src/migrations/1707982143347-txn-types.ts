import { MigrationInterface, QueryRunner } from "typeorm";

export class txnTypes1707982143347 implements MigrationInterface {
    name = "txnTypes1707982143347";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."transaction_type_enum" AS ENUM('deposit', 'trade', 'failed', 'withdrawal')`
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
            `CREATE TYPE "public"."transaction_type_enum_old" AS ENUM('deposit', 'failed', 'trade')`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transaction_type_enum_old" USING "type"::"text"::"public"."transaction_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."transaction_type_enum_old" RENAME TO "transaction_type_enum"`
        );
    }
}
