import { MigrationInterface, QueryRunner } from "typeorm";

export class blacklistReasonFailure1716826149934 implements MigrationInterface {
    name = 'blacklistReasonFailure1716826149934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."blacklist_reason" RENAME TO "blacklist_reason_old"`);
        await queryRunner.query(`CREATE TYPE "public"."blacklist_reason" AS ENUM('not_meme', 'duplicate', 'failure')`);
        await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "is_blacklisted" TYPE "public"."blacklist_reason" USING "is_blacklisted"::"text"::"public"."blacklist_reason"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_reason_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."blacklist_reason_old" AS ENUM('not_meme', 'duplicate')`);
        await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "is_blacklisted" TYPE "public"."blacklist_reason_old" USING "is_blacklisted"::"text"::"public"."blacklist_reason_old"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_reason"`);
        await queryRunner.query(`ALTER TYPE "public"."blacklist_reason_old" RENAME TO "blacklist_reason"`);
    }

}
