import { MigrationInterface, QueryRunner } from "typeorm";

export class watchlistAssetsIdxRedo21707284050227 implements MigrationInterface {
    name = 'watchlistAssetsIdxRedo21707284050227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watchlist_assets" ADD CONSTRAINT "watchlist_asset_provider_address_idx" UNIQUE ("provider", "contract_address", "user_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watchlist_assets" DROP CONSTRAINT "watchlist_asset_provider_address_idx"`);
    }

}
