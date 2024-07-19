import { MigrationInterface, QueryRunner } from "typeorm";

export class frogs1717436257090 implements MigrationInterface {
    name = "frogs1717436257090";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "category_entries" DROP CONSTRAINT "category_entry_token_idx"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."category_enum" RENAME TO "category_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."category_enum" AS ENUM('united_nations', 'politics', 'religion', 'celebrities', 'athletes', 'corporations', 'executives', 'dogs', 'cats', 'media', 'sports', 'influencers', 'actors', 'birds', 'rappers', 'characters', 'trump', 'presidential_candidates_twenty_four', 'bonk', 'memes', 'frogs')`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" ALTER COLUMN "category" TYPE "public"."category_enum" USING "category"::"text"::"public"."category_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."category_enum_old"`);
        await queryRunner.query(
            `ALTER TABLE "category_entries" ADD CONSTRAINT "category_entry_token_idx" UNIQUE ("token_id", "category")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "category_entries" DROP CONSTRAINT "category_entry_token_idx"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."category_enum_old" AS ENUM('united_nations', 'politics', 'religion', 'celebrities', 'athletes', 'corporations', 'executives', 'dogs', 'cats', 'media', 'sports', 'influencers', 'actors', 'birds', 'rappers', 'characters', 'trump', 'presidential_candidates_twenty_four', 'bonk', 'memes')`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" ALTER COLUMN "category" TYPE "public"."category_enum_old" USING "category"::"text"::"public"."category_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."category_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."category_enum_old" RENAME TO "category_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" ADD CONSTRAINT "category_entry_token_idx" UNIQUE ("category", "token_id")`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "username" SET DEFAULT ''`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`
        );
    }
}
