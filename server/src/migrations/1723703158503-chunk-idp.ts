import { MigrationInterface, QueryRunner } from "typeorm";

export class ChunkIdp1723703158503 implements MigrationInterface {
    name = "ChunkIdp1723703158503";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "idempotency" text NOT NULL DEFAULT uuid_generate_v4()`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "UQ_9e9a6b3180684a5638327e5ddfc" UNIQUE ("idempotency")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "length_ms" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ALTER COLUMN "audio_url" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "UQ_9e9a6b3180684a5638327e5ddfc"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP COLUMN "idempotency"`
        );
    }
}
