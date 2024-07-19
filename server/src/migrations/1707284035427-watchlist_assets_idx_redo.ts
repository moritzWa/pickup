import { MigrationInterface, QueryRunner } from "typeorm";

export class watchlistAssetsIdxRedo1707284035427 implements MigrationInterface {
    name = 'watchlistAssetsIdxRedo1707284035427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watchlist_assets" DROP CONSTRAINT "watchlist_asset_provider_address_idx"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watchlist_assets" ADD CONSTRAINT "watchlist_asset_provider_address_idx" UNIQUE ("provider", "contract_address")`);
    }

}
