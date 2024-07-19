import { FindManyOptions } from "typeorm";
import { pgTokenRepo } from "../../postgres";
import { Token } from "src/core/infra/postgres/entities";

export const find = async (options: FindManyOptions<Token>) =>
    pgTokenRepo.find(options);
