import { MigrationInterface, QueryRunner } from "typeorm";

export class Queue1723094705965 implements MigrationInterface {
    name = "Queue1723094705965";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "queue" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" double precision NOT NULL, "user_id" uuid NOT NULL, "content_id" uuid NOT NULL, CONSTRAINT "PK_4adefbd9c73b3f9a49985a5529f" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "user_id_idx" ON "queue" ("user_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "content_id_idx" ON "queue" ("content_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "queue" ADD CONSTRAINT "FK_180765adb3ea4bd3936e58479ae" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "queue" ADD CONSTRAINT "FK_15f5d34e532905867758eea5c59" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "queue" DROP CONSTRAINT "FK_15f5d34e532905867758eea5c59"`
        );
        await queryRunner.query(
            `ALTER TABLE "queue" DROP CONSTRAINT "FK_180765adb3ea4bd3936e58479ae"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ALTER COLUMN "snippet" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "fetchedPagesIfPDF"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "totalPagesIfPDF"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "publishedTime"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "lang"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "siteName"`
        );
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "dir"`);
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "byline"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "excerpt"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "length"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "metadata" jsonb`
        );
        await queryRunner.query(`DROP INDEX "public"."content_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."user_id_idx"`);
        await queryRunner.query(`DROP TABLE "queue"`);
    }
}
