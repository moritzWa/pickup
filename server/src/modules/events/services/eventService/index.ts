import { AccountProvider, Event } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { TradingIntegrationService } from "src/shared/integrations";
import { pgEventRepo } from "../../infra/postgres";
import { FindManyOptions, FindOneOptions, FindOptionsWhere } from "typeorm";
import { EventParams } from "../../infra/postgres/eventRepo";

const find = async (options: FindManyOptions<Event>) =>
    pgEventRepo.find(options);

const findById = async (id: string, options?: FindOneOptions<Event>) =>
    pgEventRepo.findById(id, options);

const create = async (event: EventParams) => pgEventRepo.create(event);

const deleteById = async (id: string) =>
    pgEventRepo.delete({
        id,
    });

export const EventService = {
    find,
    findById,
    create,
    deleteById,
};
