import { MigrationInterface, QueryRunner } from "typeorm";

export class watchlistAssets1707282651640 implements MigrationInterface {
    name = 'watchlistAssets1707282651640'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "watchlist_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" text NOT NULL, "contract_address" text NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "watchlist_asset_provider_address_idx" UNIQUE ("provider", "contract_address"), CONSTRAINT "PK_0e22585c7cd4c7249f1ced73f01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "watchlist_assets" ADD CONSTRAINT "FK_d8149f73707167a5c9793821414" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watchlist_assets" DROP CONSTRAINT "FK_d8149f73707167a5c9793821414"`);
        await queryRunner.query(`DROP TABLE "watchlist_assets"`);
    }

}
