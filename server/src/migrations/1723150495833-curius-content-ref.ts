import { MigrationInterface, QueryRunner } from "typeorm";

export class CuriusContentRef1723150495833 implements MigrationInterface {
    name = "CuriusContentRef1723150495833";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "content_id" uuid`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD CONSTRAINT "FK_eafd6a8a70352dc1a11a6057516" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP CONSTRAINT "FK_eafd6a8a70352dc1a11a6057516"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "content_id"`
        );
    }
}
