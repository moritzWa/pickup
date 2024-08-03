import { Repository } from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import { CuriusLink } from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type LinkResponse = FailureOrSuccess<DefaultErrors, CuriusLink>;

export class PostgresCuriusLinkRepository {
    constructor(private model: typeof CuriusLink) {}

    private get repo(): Repository<CuriusLink> {
        return dataSource.getRepository(this.model);
    }

    // only save for now
    async save(obj: CuriusLink): Promise<LinkResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
