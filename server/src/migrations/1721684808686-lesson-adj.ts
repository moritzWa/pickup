import { MigrationInterface, QueryRunner } from "typeorm";

export class LessonAdj1721684808686 implements MigrationInterface {
    name = "LessonAdj1721684808686";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // drop the sessions table
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" ADD "user_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "sessions_lesson_id_idx" ON "lesson_sessions" ("lesson_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "progress_user_id_idx" ON "lesson_progress" ("user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" ADD CONSTRAINT "FK_0d9292b3eb40707950eeeba9617" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_0d9292b3eb40707950eeeba9617"`
        );
        await queryRunner.query(`DROP INDEX "public"."progress_user_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."sessions_lesson_id_idx"`);
        await queryRunner.query(
            `ALTER TABLE "lesson_progress" DROP COLUMN "user_id"`
        );
    }
}
