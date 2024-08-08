import { MigrationInterface, QueryRunner } from "typeorm";

export class CuriusNullableSnippet1723062683776 implements MigrationInterface {
    name = "CuriusNullableSnippet1723062683776";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "curius_links" ALTER COLUMN "snippet" DROP NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "curius_links" ALTER COLUMN "snippet" SET NOT NULL`
        );
    }
}
