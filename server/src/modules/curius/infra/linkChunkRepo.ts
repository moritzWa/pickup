import { Repository } from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import { CuriusLinkChunk } from "src/core/infra/postgres/entities/Curius/CuriusLinkChunk";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type LinkResponse = FailureOrSuccess<DefaultErrors, CuriusLinkChunk>;
type LinksResponse = FailureOrSuccess<DefaultErrors, CuriusLinkChunk[]>;

export class PostgresCuriusLinkChunkRepository {
    constructor(private model: typeof CuriusLinkChunk) {}

    private get repo(): Repository<CuriusLinkChunk> {
        return dataSource.getRepository(this.model);
    }

    // only save for now
    async save(obj: CuriusLinkChunk): Promise<LinkResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async find(): Promise<LinksResponse> {
        try {
            return success(await this.repo.find());
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
