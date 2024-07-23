import { MigrationInterface, QueryRunner } from "typeorm";

export class CourseProgress1721698676058 implements MigrationInterface {
    name = "CourseProgress1721698676058";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "course_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "most_recent_lesson_id" uuid, "course_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_eadd1b31d44023e533eb847c4f7" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_578f66595af7b446be0f546468" ON "course_progress" ("course_id", "user_id") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_f34e3a227170e0ce674e0afb58" ON "lesson_progress" ("lesson_id", "user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "course_progress" ADD CONSTRAINT "FK_20ac7fb87d04bf18d32de34c371" FOREIGN KEY ("most_recent_lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "course_progress" ADD CONSTRAINT "FK_468b14b39d8428b77d8630bd5cc" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "course_progress" ADD CONSTRAINT "FK_85392161b4c16580b3a7d937d94" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "course_progress" DROP CONSTRAINT "FK_85392161b4c16580b3a7d937d94"`
        );
        await queryRunner.query(
            `ALTER TABLE "course_progress" DROP CONSTRAINT "FK_468b14b39d8428b77d8630bd5cc"`
        );
        await queryRunner.query(
            `ALTER TABLE "course_progress" DROP CONSTRAINT "FK_20ac7fb87d04bf18d32de34c371"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_f34e3a227170e0ce674e0afb58"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_578f66595af7b446be0f546468"`
        );
        await queryRunner.query(`DROP TABLE "course_progress"`);
    }
}
