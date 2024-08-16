import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentType1723747965818 implements MigrationInterface {
    name = "ContentType1723747965818";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."content_type_enum" AS ENUM('article', 'podcast')`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "type" "public"."content_type_enum" NOT NULL DEFAULT 'article'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
