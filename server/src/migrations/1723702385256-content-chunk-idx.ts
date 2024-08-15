import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentChunkIdx1723702385256 implements MigrationInterface {
    name = "ContentChunkIdx1723702385256";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_174fee932b714de458306d24cc3"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP COLUMN "contentId"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_30711dcdd331d04b5179557d219" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_30711dcdd331d04b5179557d219"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "length_ms" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "audio_url" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "contentId" uuid`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_174fee932b714de458306d24cc3" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
