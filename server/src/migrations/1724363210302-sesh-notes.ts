import { MigrationInterface, QueryRunner } from "typeorm";

export class SeshNotes1724363210302 implements MigrationInterface {
    name = "SeshNotes1724363210302";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "notes" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "notes"`
        );
    }
}
