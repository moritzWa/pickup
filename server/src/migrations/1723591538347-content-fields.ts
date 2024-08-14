import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentFields1723591538347 implements MigrationInterface {
    name = "ContentFields1723591538347";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "is_processed" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(`ALTER TABLE "content" ADD "embedding" vector`);
        await queryRunner.query(
            `ALTER TABLE "content" ADD "insertion_id" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "embedding"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "is_processed"`
        );
    }
}
