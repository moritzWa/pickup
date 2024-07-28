import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentMessage1721941757333 implements MigrationInterface {
    name = "ContentMessage1721941757333";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "content_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "audio_url" text, "is_bot" boolean NOT NULL, "content_session_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_28932019e546865225da8f7cc72" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "content_messages_content_session_id_idx" ON "content_messages" ("content_session_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "content_messages_user_id_idx" ON "content_messages" ("user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "length_seconds" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content_messages" ADD CONSTRAINT "FK_b6e733ee021d2eb375c420244b2" FOREIGN KEY ("content_session_id") REFERENCES "content_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "content_messages" ADD CONSTRAINT "FK_f99ea1126e8b9cd57d9750fcc4a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_messages" DROP CONSTRAINT "FK_f99ea1126e8b9cd57d9750fcc4a"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_messages" DROP CONSTRAINT "FK_b6e733ee021d2eb375c420244b2"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "length_seconds" DROP NOT NULL`
        );
        await queryRunner.query(
            `DROP INDEX "public"."content_messages_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."content_messages_content_session_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "content_messages"`);
    }
}
