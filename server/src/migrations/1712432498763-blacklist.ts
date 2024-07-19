import { MigrationInterface, QueryRunner } from "typeorm";

export class blacklist1712432498763 implements MigrationInterface {
    name = 'blacklist1712432498763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "blacklist_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" text NOT NULL, "symbol" text NOT NULL, "name" text NOT NULL, "coingecko_id" text, "contract_address" text NOT NULL, "icon_image_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_1713bcba6ce8eec7cdb1c4fef44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "blacklist_token_provider_idx" ON "blacklist_tokens" ("provider") `);
        await queryRunner.query(`CREATE INDEX "blacklist_token_coingecko_id_idx" ON "blacklist_tokens" ("coingecko_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "blacklist_token_contract_address_provider_idx" ON "blacklist_tokens" ("contract_address", "provider") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."blacklist_token_contract_address_provider_idx"`);
        await queryRunner.query(`DROP INDEX "public"."blacklist_token_coingecko_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."blacklist_token_provider_idx"`);
        await queryRunner.query(`DROP TABLE "blacklist_tokens"`);
    }

}
