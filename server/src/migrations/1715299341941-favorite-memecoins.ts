import { MigrationInterface, QueryRunner } from "typeorm";

export class favoriteMemecoins1715299341941 implements MigrationInterface {
    name = "favoriteMemecoins1715299341941";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "favorite_memecoins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" text NOT NULL, "contract_address" text NOT NULL, "icon_image_url" text, "symbol" text NOT NULL, "name" text NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "favorite_memecoins_token_idx" UNIQUE ("provider", "contract_address", "user_id"), CONSTRAINT "PK_dc7f9c949cc79c24b3f83885f09" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "favorite_memecoins_user_idx" ON "favorite_memecoins" ("user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "favorite_memecoins" ADD CONSTRAINT "FK_1c5fe54f8211482dea4cb8e2781" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "favorite_memecoins" DROP CONSTRAINT "FK_1c5fe54f8211482dea4cb8e2781"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."favorite_memecoins_user_idx"`
        );
        await queryRunner.query(`DROP TABLE "favorite_memecoins"`);
    }
}
