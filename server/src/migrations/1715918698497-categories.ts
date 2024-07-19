import { MigrationInterface, QueryRunner } from "typeorm";

export class categories1715918698497 implements MigrationInterface {
    name = "categories1715918698497";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" text NOT NULL, "name" text NOT NULL, "icon_image_url" text NOT NULL, "banner_image_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "categories_slug_idx" ON "categories" ("slug") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."categories_slug_idx"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }
}
