import { MigrationInterface, QueryRunner } from "typeorm";

export class lessons1721628628170 implements MigrationInterface {
    name = "lessons1721628628170";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "lesson_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "audio_url" text, "lesson_id" uuid NOT NULL, "course_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_07c712bd1808a8a198d9ff2ef38" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "sessions_lesson_id_idx" ON "lesson_sessions" ("lesson_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "sessions_course_id_idx" ON "lesson_sessions" ("course_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "sessions_user_id_idx" ON "lesson_sessions" ("user_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "lesson_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "participant_id" uuid NOT NULL, "lesson_id" uuid NOT NULL, "course_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_e6223ebbc5f8f5fce40e0193de1" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "progress_participant_id_idx" ON "lesson_progress" ("participant_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "progress_lesson_id_idx" ON "lesson_progress" ("lesson_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "progress_course_id_idx" ON "lesson_progress" ("course_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "courses" ADD "default_character_id" uuid`
        );
        await queryRunner.query(
            `ALTER TABLE "courses" ADD CONSTRAINT "FK_5e1999e2959d23e81455523ab2f" FOREIGN KEY ("default_character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_sessions" ADD CONSTRAINT "FK_df00dd2d5e00ae9da1b0862aed4" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_sessions" ADD CONSTRAINT "FK_40b6b7fe87652dcee5c19c30e8c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_sessions" ADD CONSTRAINT "FK_862684e1c9660723ff8c253d28a" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_44fffbd8101ad1395f9685a0e7d" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_980e74721039ebe210fee2eeca2" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_112753761c2a01adab9677b717f" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_112753761c2a01adab9677b717f"`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_980e74721039ebe210fee2eeca2"`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_44fffbd8101ad1395f9685a0e7d"`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_sessions" DROP CONSTRAINT "FK_862684e1c9660723ff8c253d28a"`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_sessions" DROP CONSTRAINT "FK_40b6b7fe87652dcee5c19c30e8c"`
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_sessions" DROP CONSTRAINT "FK_df00dd2d5e00ae9da1b0862aed4"`
        );
        await queryRunner.query(
            `ALTER TABLE "courses" DROP CONSTRAINT "FK_5e1999e2959d23e81455523ab2f"`
        );
        await queryRunner.query(
            `ALTER TABLE "courses" DROP COLUMN "default_character_id"`
        );
        await queryRunner.query(`DROP INDEX "public"."progress_course_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."progress_lesson_id_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."progress_participant_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "lesson_progress"`);
        await queryRunner.query(`DROP INDEX "public"."sessions_user_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."sessions_course_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."sessions_lesson_id_idx"`);
        await queryRunner.query(`DROP TABLE "lesson_sessions"`);
    }
}
