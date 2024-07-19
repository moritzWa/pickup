import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { FeedLike } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

export type FeedLikeParams = Omit<FeedLike, "id" | "createdAt" | "updatedAt">;
export type FeedLikeResponse = FailureOrSuccess<DefaultErrors, FeedLike>;
export type FeedLikeArrayResponse = FailureOrSuccess<DefaultErrors, FeedLike[]>;

export class PostgresFeedLikeRepository {
    constructor(private model: typeof FeedLike) {}

    private get repo(): Repository<FeedLike> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<FeedLike>
    ): Promise<FeedLikeArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findById(
        id: string,
        opts?: FindOneOptions<FeedLike>
    ): Promise<FeedLikeResponse> {
        try {
            const feedLike = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id },
            });

            if (!feedLike) {
                return failure(new NotFoundError("FeedLike not found."));
            }

            return success(feedLike);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        feedLikeId: string,
        updates: Partial<FeedLike>,
        dbTxn?: EntityManager
    ): Promise<FeedLikeResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: feedLikeId }, updates)
                : await this.repo.update(feedLikeId, updates);

            const feedLike = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: feedLikeId })
                : await this.repo.findOneBy({ id: feedLikeId });

            if (!feedLike) {
                return failure(new NotFoundError("FeedLike does not exist!"));
            }

            return success(feedLike);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: FeedLikeParams,
        dbTxn?: EntityManager
    ): Promise<FeedLikeResponse> {
        try {
            const feedLike = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(feedLike);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
