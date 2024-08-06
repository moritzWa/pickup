import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureVectorType implements MigrationInterface {
    name = "EnsureVectorType";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "curius_link_chunks"
            DROP COLUMN "embedding",
            ADD COLUMN "embedding" VECTOR(256) NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "curius_link_chunks"
            DROP COLUMN "embedding",
            ADD COLUMN "embedding" text NOT NULL;
        `);
    }
}
