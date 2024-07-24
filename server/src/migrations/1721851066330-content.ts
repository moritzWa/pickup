import { MigrationInterface, QueryRunner } from "typeorm";

export class Content1721851066330 implements MigrationInterface {
    name = "Content1721851066330";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "context" text NOT NULL, "audio_url" text NOT NULL, "author_name" text NOT NULL, "author_image_url" text, "title" text NOT NULL, "summary" text, "website_url" text NOT NULL, "follow_up_questions" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6a2083913f3647b44f205204e36" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "content_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp_cursor" numeric, "content_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_12efe260129dc3eb9197ee0f088" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD "content_session_id" uuid`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" DROP CONSTRAINT "FK_cb971c6e56668fab6b004b43afd"`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ALTER COLUMN "lesson_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "messages_content_session_id_idx" ON "messages" ("content_session_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD CONSTRAINT "FK_dfbbfa0aef05dc5f54d8f99e1b2" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD CONSTRAINT "FK_c22f28058a7dce21b05598f3d70" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD CONSTRAINT "FK_a24e7ab4a27efa6e4407b5e4396" FOREIGN KEY ("content_session_id") REFERENCES "content_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD CONSTRAINT "FK_cb971c6e56668fab6b004b43afd" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "messages" DROP CONSTRAINT "FK_cb971c6e56668fab6b004b43afd"`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" DROP CONSTRAINT "FK_a24e7ab4a27efa6e4407b5e4396"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP CONSTRAINT "FK_c22f28058a7dce21b05598f3d70"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP CONSTRAINT "FK_dfbbfa0aef05dc5f54d8f99e1b2"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."messages_content_session_id_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ALTER COLUMN "lesson_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD CONSTRAINT "FK_cb971c6e56668fab6b004b43afd" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" DROP COLUMN "content_session_id"`
        );
        await queryRunner.query(`DROP TABLE "content_sessions"`);
        await queryRunner.query(`DROP TABLE "content"`);
    }
}
