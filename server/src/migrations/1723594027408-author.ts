import { MigrationInterface, QueryRunner } from "typeorm";

export class Author1723594027408 implements MigrationInterface {
    name = 'Author1723594027408'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_33bfeb7a2c68fef6c92fe5b77e8"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "current_queue_id" TO "current_feed_item_id"`);
        await queryRunner.query(`CREATE TABLE "authors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "image_url" text, CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "feed_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" double precision NOT NULL, "is_queued" boolean NOT NULL DEFAULT false, "is_archived" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "content_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_81ae51f2d2a41a403bbc0471ed6" UNIQUE ("user_id", "content_id", "position"), CONSTRAINT "PK_9a33f003d604fbe4060d75c7be2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "feed_items_user_id_idx" ON "feed_items" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "feed_items_content_id_idx" ON "feed_items" ("content_id") `);
        await queryRunner.query(`CREATE INDEX "feed_item_user_created_at_idx" ON "feed_items" ("user_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "feed_item_user_position_idx" ON "feed_items" ("user_id", "position") `);
        await queryRunner.query(`CREATE TABLE "content_authors" ("author_id" uuid NOT NULL, "content_id" uuid NOT NULL, CONSTRAINT "PK_4418cebe380cdca9f67661537c0" PRIMARY KEY ("author_id", "content_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_939732b593a936c4824cbdb7de" ON "content_authors" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6a6dc0025622bd0b987a9fee8" ON "content_authors" ("content_id") `);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "author_name"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "author_image_url"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`);
        await queryRunner.query(`ALTER TYPE "public"."interaction_type_enum" RENAME TO "interaction_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."interaction_type_enum" AS ENUM('likes', 'bookmarked', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`);
        await queryRunner.query(`ALTER TABLE "interactions" ALTER COLUMN "type" TYPE "public"."interaction_type_enum" USING "type"::"text"::"public"."interaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."interaction_type_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_edf0676ed89862b0c4f8a3a88e" ON "interactions" ("content_id", "user_id", "type") `);
        await queryRunner.query(`ALTER TABLE "feed_items" ADD CONSTRAINT "FK_130e5a9584dc519702a4e003828" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feed_items" ADD CONSTRAINT "FK_08fccf05888736e612180966463" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9314068583a2383c58f24b528d5" FOREIGN KEY ("current_feed_item_id") REFERENCES "feed_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_authors" ADD CONSTRAINT "FK_939732b593a936c4824cbdb7de9" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`);
        await queryRunner.query(`ALTER TABLE "content_authors" DROP CONSTRAINT "FK_939732b593a936c4824cbdb7de9"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9314068583a2383c58f24b528d5"`);
        await queryRunner.query(`ALTER TABLE "feed_items" DROP CONSTRAINT "FK_08fccf05888736e612180966463"`);
        await queryRunner.query(`ALTER TABLE "feed_items" DROP CONSTRAINT "FK_130e5a9584dc519702a4e003828"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`);
        await queryRunner.query(`CREATE TYPE "public"."interaction_type_enum_old" AS ENUM('likes', 'bookmarked', 'scrolled_past', 'skipped', 'left_in_progress')`);
        await queryRunner.query(`ALTER TABLE "interactions" ALTER COLUMN "type" TYPE "public"."interaction_type_enum_old" USING "type"::"text"::"public"."interaction_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."interaction_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."interaction_type_enum_old" RENAME TO "interaction_type_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_edf0676ed89862b0c4f8a3a88e" ON "interactions" ("type", "content_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "content" ADD "author_image_url" text`);
        await queryRunner.query(`ALTER TABLE "content" ADD "author_name" text NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6a6dc0025622bd0b987a9fee8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_939732b593a936c4824cbdb7de"`);
        await queryRunner.query(`DROP TABLE "content_authors"`);
        await queryRunner.query(`DROP INDEX "public"."feed_item_user_position_idx"`);
        await queryRunner.query(`DROP INDEX "public"."feed_item_user_created_at_idx"`);
        await queryRunner.query(`DROP INDEX "public"."feed_items_content_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."feed_items_user_id_idx"`);
        await queryRunner.query(`DROP TABLE "feed_items"`);
        await queryRunner.query(`DROP TABLE "authors"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "current_feed_item_id" TO "current_queue_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_33bfeb7a2c68fef6c92fe5b77e8" FOREIGN KEY ("current_queue_id") REFERENCES "queue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
