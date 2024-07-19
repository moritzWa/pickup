import { MigrationInterface, QueryRunner } from "typeorm";

export class swapType1714761675400 implements MigrationInterface {
    name = 'swapType1714761675400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."swap_type_enum" AS ENUM('buy', 'sell', 'unknown')`);
        await queryRunner.query(`ALTER TABLE "swaps" ADD "type" "public"."swap_type_enum" NOT NULL DEFAULT 'unknown'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."swap_type_enum"`);
    }

}
