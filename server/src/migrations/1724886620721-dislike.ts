import { MigrationInterface, QueryRunner } from "typeorm";

export class Dislike1724886620721 implements MigrationInterface {
    name = "Dislike1724886620721";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Dropping foreign key constraints on content_authors
        // await queryRunner.query(
        //     `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`
        // );
        // await queryRunner.query(
        //     `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_content_authors_author_id"`
        // );

        // Adding new columns to content_sessions
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "is_disliked" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "disliked_at" TIMESTAMP`
        );

        // Adding new column to feed_items
        await queryRunner.query(
            `ALTER TABLE "feed_items" ADD "is_disliked" boolean NOT NULL DEFAULT false`
        );

        // Dropping and recreating index on interactions
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."interaction_type_enum" RENAME TO "interaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum" AS ENUM('likes', 'disliked', 'undisliked', 'bookmarked', 'unbookmarked', 'queued', 'started_listening', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`
        );
        await queryRunner.query(
            `ALTER TABLE "interactions" ALTER COLUMN "type" TYPE "public"."interaction_type_enum" USING "type"::"text"::"public"."interaction_type_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."interaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_edf0676ed89862b0c4f8a3a88e" ON "interactions" ("content_id", "user_id", "type") `
        );

        // Re-adding foreign key constraints on content_authors
        // await queryRunner.query(
        //     `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        // );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverting changes made in the up method

        // Dropping foreign key constraints on content_authors
        // await queryRunner.query(
        //     `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`
        // );

        // Dropping and recreating index on interactions
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum_old" AS ENUM('likes', 'bookmarked', 'unbookmarked', 'queued', 'started_listening', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`
        );
        await queryRunner.query(
            `ALTER TABLE "interactions" ALTER COLUMN "type" TYPE "public"."interaction_type_enum_old" USING "type"::"text"::"public"."interaction_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."interaction_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."interaction_type_enum_old" RENAME TO "interaction_type_enum"`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_edf0676ed89862b0c4f8a3a88e" ON "interactions" ("type", "content_id", "user_id") `
        );

        // Dropping new columns from feed_items and content_sessions
        await queryRunner.query(
            `ALTER TABLE "feed_items" DROP COLUMN "is_disliked"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "disliked_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "is_disliked"`
        );

        // Re-adding foreign key constraints on content_authors
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_content_authors_author_id" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }
}
