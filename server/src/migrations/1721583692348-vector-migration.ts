import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmbeddingColumn1722801464849 implements MigrationInterface {
    name = "AddEmbeddingColumn1722801464849";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "curius_links"
            ADD COLUMN "embedding" VECTOR(256);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "curius_links"
            DROP COLUMN "embedding";
        `);
    }
}
