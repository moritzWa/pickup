import {
    EntityManager,
    FindManyOptions,
    getRepository,
    InsertResult,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AccountProvider,
    WatchlistAsset,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type WatchlistAssetResponse = FailureOrSuccess<DefaultErrors, WatchlistAsset>;
type WatchlistAssetArrayResponse = FailureOrSuccess<
    DefaultErrors,
    WatchlistAsset[]
>;

export class PostgresWatchlistAssetRepository {
    constructor(private model: typeof WatchlistAsset) {}

    private get repo(): Repository<WatchlistAsset> {
        return dataSource.getRepository(this.model);
    }

    // findForUser
    public async findForUser(
        userId: string
    ): Promise<WatchlistAssetArrayResponse> {
        try {
            const watchlistAssets = await this.repo.find({
                where: { userId },
            });
            return success(watchlistAssets);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    // createForUser
    public async createForUser(
        userId: string,
        provider: AccountProvider,
        contractAddress: string
    ): Promise<WatchlistAssetResponse> {
        try {
            const watchlistAsset = await this.repo.save({
                userId,
                provider,
                contractAddress,
            });
            return success(watchlistAsset);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    // deleteForUser
    public async deleteForUser(
        userId: string,
        provider: AccountProvider,
        contractAddress: string
    ): Promise<WatchlistAssetResponse> {
        try {
            const watchlistAsset = await this.repo.findOne({
                where: { userId, provider, contractAddress },
            });
            if (!watchlistAsset) {
                return failure(new NotFoundError("WatchlistAsset"));
            }
            await this.repo.remove(watchlistAsset);
            return success(watchlistAsset);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }
}
