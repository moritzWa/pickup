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
import { FeedComment } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

export type FeedCommentParams = Omit<
    FeedComment,
    "id" | "createdAt" | "updatedAt"
>;
export type FeedCommentResponse = FailureOrSuccess<DefaultErrors, FeedComment>;
export type FeedCommentArrayResponse = FailureOrSuccess<
    DefaultErrors,
    FeedComment[]
>;

export class PostgresFeedCommentRepository {
    constructor(private model: typeof FeedComment) {}

    private get repo(): Repository<FeedComment> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<FeedComment>
    ): Promise<FeedCommentArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findById(
        id: string,
        opts?: FindOneOptions<FeedComment>
    ): Promise<FeedCommentResponse> {
        try {
            const feedComment = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id },
            });

            if (!feedComment) {
                return failure(new NotFoundError("FeedComment not found."));
            }

            return success(feedComment);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        feedCommentId: string,
        updates: Partial<FeedComment>,
        dbTxn?: EntityManager
    ): Promise<FeedCommentResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: feedCommentId }, updates)
                : await this.repo.update(feedCommentId, updates);

            const feedComment = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: feedCommentId })
                : await this.repo.findOneBy({ id: feedCommentId });

            if (!feedComment) {
                return failure(
                    new NotFoundError("FeedComment does not exist!")
                );
            }

            return success(feedComment);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: FeedCommentParams,
        dbTxn?: EntityManager
    ): Promise<FeedCommentResponse> {
        try {
            const feedComment = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(feedComment);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
