import { BlacklistToken } from "src/core/infra/postgres/entities";
import { FindManyOptions } from "typeorm";
import { blacklistTokenEntryRepo } from "../infra/postgres";
import { BlacklistTokenParams } from "../infra/postgres/blacklistTokenRepo";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";

const find = (options: FindManyOptions<BlacklistToken>) =>
    blacklistTokenEntryRepo.find(options);

const findAll = () => blacklistTokenEntryRepo.findAll();

const create = (obj: BlacklistTokenParams) =>
    blacklistTokenEntryRepo.create(obj);

const toSet = (blacklistTokens: BlacklistToken[]): Set<string> =>
    new Set(
        blacklistTokens.map((a) =>
            TokenService.buildKey(a.provider, a.contractAddress)
        )
    );

export const BlacklistService = {
    find,
    findAll,
    create,
    toSet,
};
