import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIsBlacklisted1715922669355 implements MigrationInterface {
    name = 'tokenIsBlacklisted1715922669355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."blacklist_reason" AS ENUM('not_meme', 'duplicate')`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "is_blacklisted" "public"."blacklist_reason"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "is_blacklisted"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_reason"`);
    }

}
