import { MigrationInterface, QueryRunner } from "typeorm";

export class ChunkExtraFields1723705112407 implements MigrationInterface {
    name = "ChunkExtraFields1723705112407";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "start_time_ms" integer`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "end_time_ms" integer`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "audio_url" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
