import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentChunks1723611187189 implements MigrationInterface {
    name = "ContentChunks1723611187189";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "content_chunks" ("id" SERIAL NOT NULL, "chunk_index" text NOT NULL, "transcript" text NOT NULL, "embedding" vector NOT NULL, "content_id" uuid NOT NULL, "contentId" uuid, CONSTRAINT "PK_fe57bc738dc681ac7fb577ec1c0" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "reference_id" text`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "released_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_174fee932b714de458306d24cc3" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_174fee932b714de458306d24cc3"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "released_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "reference_id"`
        );
        await queryRunner.query(`DROP TABLE "content_chunks"`);
    }
}
