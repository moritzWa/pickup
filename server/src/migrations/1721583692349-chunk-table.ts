import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmbeddingColumn1722801464849 implements MigrationInterface {
    name = "AddEmbeddingColumn1722801464850";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "curius_link_chunks" (
                "id" SERIAL PRIMARY KEY,
                "chunkIndex" integer NOT NULL,
                "text" text NOT NULL,
                "embedding" VECTOR(256) NOT NULL,
                "linkId" integer,
                CONSTRAINT "FK_link" FOREIGN KEY ("linkId") REFERENCES "curius_links"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            ALTER TABLE "curius_links"
            DROP COLUMN "embedding";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "curius_links"
            ADD COLUMN "embedding" VECTOR(256);
        `);

        await queryRunner.query(`
            DROP TABLE "curius_link_chunks";
        `);
    }
}
