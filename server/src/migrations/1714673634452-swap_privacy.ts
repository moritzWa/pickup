import { MigrationInterface, QueryRunner } from "typeorm";

export class swapPrivacy1714673634452 implements MigrationInterface {
    name = 'swapPrivacy1714673634452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."swap_privacy_enum" AS ENUM('public', 'following', 'private')`);
        await queryRunner.query(`ALTER TABLE "swaps" ADD "privacy" "public"."swap_privacy_enum" NOT NULL DEFAULT 'public'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "privacy"`);
        await queryRunner.query(`DROP TYPE "public"."swap_privacy_enum"`);
    }

}
