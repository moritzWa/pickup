import { FeedLike } from "src/core/infra/postgres/entities";
import { EntityManager, FindManyOptions, FindOneOptions } from "typeorm";
import { pgFeedLikeRepository } from "../infra";
import { FeedLikeParams } from "../infra/postgres/feedLikeRepo";

const find = async (options: FindManyOptions<FeedLike>) =>
    pgFeedLikeRepository.find(options);

const findById = async (id: string, opts?: FindOneOptions<FeedLike>) =>
    pgFeedLikeRepository.findById(id);

const update = (
    feedLikeId: string,
    updates: Partial<FeedLike>,
    dbTxn?: EntityManager
) => pgFeedLikeRepository.update(feedLikeId, updates, dbTxn);

const create = (params: FeedLikeParams, dbTxn?: EntityManager) =>
    pgFeedLikeRepository.create(params, dbTxn);

export const FeedLikeService = {
    find,
    findById,
    update,
    create,
};
