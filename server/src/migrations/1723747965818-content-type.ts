import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentType1723747965818 implements MigrationInterface {
    name = 'ContentType1723747965818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_174fee932b714de458306d24cc3"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" RENAME COLUMN "contentId" TO "idempotency"`);
        await queryRunner.query(`CREATE TYPE "public"."content_type_enum" AS ENUM('article', 'podcast')`);
        await queryRunner.query(`ALTER TABLE "content" ADD "type" "public"."content_type_enum" NOT NULL DEFAULT 'article'`);
        await queryRunner.query(`ALTER TABLE "content_chunks" DROP COLUMN "idempotency"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" ADD "idempotency" text NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "content_chunks" ADD CONSTRAINT "UQ_9e9a6b3180684a5638327e5ddfc" UNIQUE ("idempotency")`);
        await queryRunner.query(`ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_30711dcdd331d04b5179557d219" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_30711dcdd331d04b5179557d219"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" DROP CONSTRAINT "UQ_9e9a6b3180684a5638327e5ddfc"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" DROP COLUMN "idempotency"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" ADD "idempotency" uuid`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."content_type_enum"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" RENAME COLUMN "idempotency" TO "contentId"`);
        await queryRunner.query(`ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_174fee932b714de458306d24cc3" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
