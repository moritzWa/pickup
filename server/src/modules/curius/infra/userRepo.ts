import { Repository } from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import { CuriusUser } from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type UserResponse = FailureOrSuccess<DefaultErrors, CuriusUser>;

export class PostgresCuriusUserRepository {
    constructor(private model: typeof CuriusUser) {}

    private get repo(): Repository<CuriusUser> {
        return dataSource.getRepository(this.model);
    }

    async save(obj: CuriusUser): Promise<UserResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
