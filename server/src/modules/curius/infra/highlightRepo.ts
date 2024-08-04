import { Repository } from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import { CuriusHighlight } from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type HighlightResponse = FailureOrSuccess<DefaultErrors, CuriusHighlight>;

export class PostgresCuriusHighlightRepository {
    constructor(private model: typeof CuriusHighlight) {}

    private get repo(): Repository<CuriusHighlight> {
        return dataSource.getRepository(this.model);
    }

    async save(obj: CuriusHighlight): Promise<HighlightResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
