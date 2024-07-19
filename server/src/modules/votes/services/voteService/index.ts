import { AccountProvider, Vote } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { pgVoteRepo } from "../../infra";
import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
} from "typeorm";
import { VoteParams } from "../../infra/postgres";
import { voteForToken } from "./voteForToken";
import { unvoteForToken } from "./unvoteForToken";

const findOne = async (options: FindOneOptions<Vote>) =>
    pgVoteRepo.findOne(options);

const find = async (options: FindManyOptions<Vote>, dbTxn?: EntityManager) =>
    pgVoteRepo.find(options, dbTxn);

const save = async (obj: VoteParams, dbTxn?: EntityManager) =>
    pgVoteRepo.save(obj, dbTxn);

const saveMany = async (objs: VoteParams[]) => pgVoteRepo.saveMany(objs);

const deleteMany = async (where: FindOptionsWhere<Vote>) =>
    pgVoteRepo.delete(where);

const createMany = async (params: VoteParams[]) => {
    return pgVoteRepo.createMany(params);
};
export const VoteService = {
    findOne,
    find,
    save,
    saveMany,
    deleteMany,
    createMany,
    voteForToken,
    unvoteForToken,
};
