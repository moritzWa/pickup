import { MigrationInterface, QueryRunner } from "typeorm";

export class Interactions1723081127822 implements MigrationInterface {
    name = "Interactions1723081127822";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."interaction_type_enum" AS ENUM('likes', 'bookmarked', 'scrolled_past', 'skipped', 'left_in_progress')`
        );
        await queryRunner.query(
            `CREATE TABLE "interactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."interaction_type_enum" NOT NULL, "content_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_911b7416a6671b4148b18c18ecb" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_edf0676ed89862b0c4f8a3a88e" ON "interactions" ("content_id", "user_id", "type") `
        );
        await queryRunner.query(
            `ALTER TABLE "interactions" ADD CONSTRAINT "FK_106ed51f0d4d99e71fd5fbccd6e" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "interactions" ADD CONSTRAINT "FK_59962fa0fe4a491273c402e93fa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "interactions" DROP CONSTRAINT "FK_59962fa0fe4a491273c402e93fa"`
        );
        await queryRunner.query(
            `ALTER TABLE "interactions" DROP CONSTRAINT "FK_106ed51f0d4d99e71fd5fbccd6e"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_edf0676ed89862b0c4f8a3a88e"`
        );
        await queryRunner.query(`DROP TABLE "interactions"`);
        await queryRunner.query(`DROP TYPE "public"."interaction_type_enum"`);
    }
}
