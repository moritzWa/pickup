import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentOptionalFields1723663429374 implements MigrationInterface {
    name = 'ContentOptionalFields1723663429374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ALTER COLUMN "audio_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "content" ALTER COLUMN "length_ms" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ALTER COLUMN "length_ms" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "content" ALTER COLUMN "audio_url" SET NOT NULL`);
    }

}
