import { WatchlistAsset } from "src/core/infra/postgres/entities";
import { PostgresWatchlistAssetRepository } from "./watchlistAssetRepo";

export const watchlistAssetRepo = new PostgresWatchlistAssetRepository(
    WatchlistAsset
);
