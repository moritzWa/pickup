import { MigrationInterface, QueryRunner } from "typeorm";

export class Author1723611553327 implements MigrationInterface {
    name = 'Author1723611553327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "authors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "image_url" text, CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "content_authors" ("author_id" uuid NOT NULL, "content_id" uuid NOT NULL, CONSTRAINT "PK_4418cebe380cdca9f67661537c0" PRIMARY KEY ("author_id", "content_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_939732b593a936c4824cbdb7de" ON "content_authors" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6a6dc0025622bd0b987a9fee8" ON "content_authors" ("content_id") `);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "author_name"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "author_image_url"`);
        await queryRunner.query(`ALTER TABLE "content" ADD "reference_id" text`);
        await queryRunner.query(`ALTER TABLE "content" ADD "released_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "content_authors" ADD CONSTRAINT "FK_939732b593a936c4824cbdb7de9" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`);
        await queryRunner.query(`ALTER TABLE "content_authors" DROP CONSTRAINT "FK_939732b593a936c4824cbdb7de9"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "released_at"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "reference_id"`);
        await queryRunner.query(`ALTER TABLE "content" ADD "author_image_url" text`);
        await queryRunner.query(`ALTER TABLE "content" ADD "author_name" text NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6a6dc0025622bd0b987a9fee8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_939732b593a936c4824cbdb7de"`);
        await queryRunner.query(`DROP TABLE "content_authors"`);
        await queryRunner.query(`DROP TABLE "authors"`);
    }

}
