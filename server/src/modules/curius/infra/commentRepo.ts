import { Repository } from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import { CuriusComment } from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type CommentResponse = FailureOrSuccess<DefaultErrors, CuriusComment>;

export class PostgresCuriusCommentRepository {
    constructor(private model: typeof CuriusComment) {}

    private get repo(): Repository<CuriusComment> {
        return dataSource.getRepository(this.model);
    }

    async save(obj: CuriusComment): Promise<CommentResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
