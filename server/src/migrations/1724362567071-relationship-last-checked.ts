import { MigrationInterface, QueryRunner } from "typeorm";

export class RelationshipLastChecked1724362567071
    implements MigrationInterface
{
    name = "RelationshipLastChecked1724362567071";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "relationships" ADD "last_checked_at" TIMESTAMP`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."interaction_type_enum" RENAME TO "interaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum" AS ENUM('likes', 'bookmarked', 'unbookmarked', 'queued', 'started_listening', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`
        );
        await queryRunner.query(
            `ALTER TABLE "interactions" ALTER COLUMN "type" TYPE "public"."interaction_type_enum" USING "type"::"text"::"public"."interaction_type_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."interaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE INDEX "session_content_user_id_idx" ON "content_sessions" ("user_id", "content_id") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_edf0676ed89862b0c4f8a3a88e" ON "interactions" ("content_id", "user_id", "type") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."session_content_user_id_idx"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum_old" AS ENUM('likes', 'bookmarked', 'queued', 'started_listening', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`
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
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP COLUMN "last_checked_at"`
        );
    }
}
