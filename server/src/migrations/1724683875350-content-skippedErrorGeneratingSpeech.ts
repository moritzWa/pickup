import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentSkippedErrorGeneratingSpeech1724683875350
    implements MigrationInterface
{
    name = "ContentSkippedErrorGeneratingSpeech1724683875350";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "skipped_error_generating_speech" boolean`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "skipped_error_generating_speech"`
        );
    }
}
