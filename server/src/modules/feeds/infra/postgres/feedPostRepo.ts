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
import { FeedPost } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

export type FeedPostParams = Omit<
    FeedPost,
    "id" | "createdAt" | "updatedAt" | "user" | "token"
>;
export type FeedPostResponse = FailureOrSuccess<DefaultErrors, FeedPost>;
export type FeedPostArrayResponse = FailureOrSuccess<DefaultErrors, FeedPost[]>;

export class PostgresFeedPostRepository {
    constructor(private model: typeof FeedPost) {}

    private get repo(): Repository<FeedPost> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<FeedPost>
    ): Promise<FeedPostArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findById(
        id: string,
        opts?: FindOneOptions<FeedPost>
    ): Promise<FeedPostResponse> {
        try {
            const feedPost = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id },
            });

            if (!feedPost) {
                return failure(new NotFoundError("FeedPost not found."));
            }

            return success(feedPost);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        opts?: FindManyOptions<FeedPost>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        try {
            const count = await this.repo.count(opts);

            return success(count);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        feedPostId: string,
        updates: Partial<FeedPost>,
        dbTxn?: EntityManager
    ): Promise<FeedPostResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: feedPostId }, updates)
                : await this.repo.update(feedPostId, updates);

            const feedPost = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: feedPostId })
                : await this.repo.findOneBy({ id: feedPostId });

            if (!feedPost) {
                return failure(new NotFoundError("FeedPost does not exist!"));
            }

            return success(feedPost);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: FeedPostParams,
        dbTxn?: EntityManager
    ): Promise<FeedPostResponse> {
        try {
            const feedPost = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(feedPost);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
