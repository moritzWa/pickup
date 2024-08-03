import { Repository } from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import { CuriusMention } from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type MentionResponse = FailureOrSuccess<DefaultErrors, CuriusMention>;

export class PostgresCuriusMentionRepository {
    constructor(private model: typeof CuriusMention) {}

    private get repo(): Repository<CuriusMention> {
        return dataSource.getRepository(this.model);
    }

    async save(obj: CuriusMention): Promise<MentionResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
