import { FeedPost } from "src/core/infra/postgres/entities";
import { EntityManager, FindManyOptions, FindOneOptions } from "typeorm";
import { pgFeedPostRepository } from "../infra";
import { FeedPostParams } from "../infra/postgres/feedPostRepo";

const find = async (options: FindManyOptions<FeedPost>) =>
    pgFeedPostRepository.find(options);

const findById = async (id: string, opts?: FindOneOptions<FeedPost>) =>
    pgFeedPostRepository.findById(id);

const count = async (options: FindManyOptions<FeedPost>) =>
    pgFeedPostRepository.count(options);

const update = (
    feedPostId: string,
    updates: Partial<FeedPost>,
    dbTxn?: EntityManager
) => pgFeedPostRepository.update(feedPostId, updates, dbTxn);

const create = (params: FeedPostParams, dbTxn?: EntityManager) =>
    pgFeedPostRepository.create(params, dbTxn);

export const FeedPostService = {
    find,
    findById,
    count,
    update,
    create,
};
