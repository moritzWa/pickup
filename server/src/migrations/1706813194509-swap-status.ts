import { MigrationInterface, QueryRunner } from "typeorm";

export class swapStatus1706813194509 implements MigrationInterface {
    name = "swapStatus1706813194509";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."swap_status_enum" RENAME TO "swap_status_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."swap_status_enum" AS ENUM('pending', 'confirmed', 'finalized', 'failed')`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ALTER COLUMN "status" TYPE "public"."swap_status_enum" USING "status"::"text"::"public"."swap_status_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."swap_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."swap_status_enum_old" AS ENUM('confirmed', 'failed', 'pending')`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ALTER COLUMN "status" TYPE "public"."swap_status_enum_old" USING "status"::"text"::"public"."swap_status_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."swap_status_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."swap_status_enum_old" RENAME TO "swap_status_enum"`
        );
    }
}
