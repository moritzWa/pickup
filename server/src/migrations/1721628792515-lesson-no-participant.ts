import { MigrationInterface, QueryRunner } from "typeorm";

export class lessonNoParticipant1721628792515 implements MigrationInterface {
    name = "lessonNoParticipant1721628792515";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lessons" DROP CONSTRAINT "FK_8acbae085d6527b8c28826db855"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."lesson_participant_id_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "lessons" DROP COLUMN "participant_id"`
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "sessions_lesson_id_idx" ON "lesson_sessions" ("lesson_id") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."sessions_lesson_id_idx"`);
        await queryRunner.query(
            `ALTER TABLE "lessons" ADD "participant_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "lesson_participant_id_idx" ON "lessons" ("participant_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "lessons" ADD CONSTRAINT "FK_8acbae085d6527b8c28826db855" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }
}
