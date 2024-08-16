import { MigrationInterface, QueryRunner } from "typeorm";

export class InteractionTypes1723831694344 implements MigrationInterface {
    name = "InteractionTypes1723831694344";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."interaction_type_enum" RENAME TO "interaction_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum" AS ENUM('likes', 'bookmarked', 'queued', 'started_listening', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum_old" AS ENUM('likes', 'bookmarked', 'scrolled_past', 'skipped', 'left_in_progress', 'listened_to_beginning', 'finished')`
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
            `ALTER TABLE "content" ADD "published_at" TIMESTAMP`
        );
    }
}
