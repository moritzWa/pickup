import { MigrationInterface, QueryRunner } from "typeorm";

export class watchlistAssetIndex1707285535570 implements MigrationInterface {
    name = 'watchlistAssetIndex1707285535570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "watchlist_asset_user_id_index" ON "watchlist_assets" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."watchlist_asset_user_id_index"`);
    }

}
