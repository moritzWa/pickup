import { AccountProvider, Competition } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { TradingIntegrationService } from "src/shared/integrations";
import { pgCompetitionRepo } from "../../infra";
import { FindManyOptions, FindOneOptions, FindOptionsWhere } from "typeorm";
import { CompetitionParams } from "../../infra/postgres";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";
import { CompetitionTokenData } from "./CompetitionTokenData";
import { getActiveCompetitions } from "./getActiveCompetitions";
import { getBestCompetitions } from "./getBestCompetitions";

const findOne = async (options: FindOneOptions<Competition>) =>
    pgCompetitionRepo.findOne(options);

const find = async (options: FindManyOptions<Competition>) =>
    pgCompetitionRepo.find(options);

const save = async (obj: CompetitionParams) => pgCompetitionRepo.save(obj);

const saveMany = async (objs: CompetitionParams[]) =>
    pgCompetitionRepo.saveMany(objs);

const deleteMany = async (where: FindOptionsWhere<Competition>) =>
    pgCompetitionRepo.delete(where);

const createMany = async (params: CompetitionParams[]) => {
    return pgCompetitionRepo.createMany(params);
};

export const CompetitionService = {
    find,
    findOne,
    save,
    saveMany,
    createMany,
    deleteMany,
    getActiveCompetitions,
    getBestCompetitions,
};
