import { DefaultErrors, FailureOrSuccess, failure } from "src/core/logic";
import { FeedComment } from "src/core/infra/postgres/entities";
import { EntityManager, FindManyOptions, FindOneOptions } from "typeorm";
import { pgFeedCommentRepository } from "../infra";
import { FeedCommentParams } from "../infra/postgres/feedCommentRepo";

const find = async (options: FindManyOptions<FeedComment>) =>
    pgFeedCommentRepository.find(options);

const findById = async (id: string, opts?: FindOneOptions<FeedComment>) =>
    pgFeedCommentRepository.findById(id);

const update = (
    feedCommentId: string,
    updates: Partial<FeedComment>,
    dbTxn?: EntityManager
) => pgFeedCommentRepository.update(feedCommentId, updates, dbTxn);

const create = (params: FeedCommentParams, dbTxn?: EntityManager) =>
    pgFeedCommentRepository.create(params, dbTxn);

export const FeedCommentService = {
    find,
    findById,
    update,
    create,
};
