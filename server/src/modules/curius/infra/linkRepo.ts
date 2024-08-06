import { Repository } from "typeorm";

import { OpenAI } from "openai";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { CuriusLink, CuriusLinkChunk } from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";

type LinkResponse = FailureOrSuccess<DefaultErrors, CuriusLink>;
type LinksResponse = FailureOrSuccess<DefaultErrors, CuriusLink[]>;

type LinkWithDistance = CuriusLink & {
    averageDistance: number;
    minDistance: number;
};
type LinksWithDistanceResponse = FailureOrSuccess<
    DefaultErrors,
    LinkWithDistance[]
>;

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

    async find(): Promise<LinksResponse> {
        try {
            return success(await this.repo.find());
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findSimilarLinks(
        query: string,
        limit: number = 3
    ): Promise<LinksWithDistanceResponse> {
        try {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-large",
                dimensions: 256,
                input: query,
                encoding_format: "float",
            });

            const vector = embedding.data[0].embedding;

            const result = await this.repo
                .createQueryBuilder("curius_links")
                .select("curius_links")
                .addSelect(
                    "AVG(chunks.embedding <-> :embedding)",
                    "average_distance"
                )
                .addSelect(
                    "MIN(chunks.embedding <-> :embedding)",
                    "min_distance"
                )
                .innerJoin(
                    CuriusLinkChunk,
                    "chunks",
                    "curius_links.id = chunks.linkId"
                )
                .setParameter("embedding", pgvector.toSql(vector))
                .groupBy("curius_links.id")
                .orderBy("min_distance", "ASC")
                .limit(limit)
                .getRawAndEntities();

            const linksWithDistance = result.entities.map((entity, index) => ({
                ...entity,
                averageDistance: parseFloat(result.raw[index].average_distance),
                minDistance: parseFloat(result.raw[index].min_distance),
            }));

            return success(linksWithDistance);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
