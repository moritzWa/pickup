import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Repository,
} from "typeorm";
import { sql } from "pg-sql";
import * as pgvector from "pgvector/pg";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { ContentChunk as ContentChunkModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { DEFAULT_LINKS_RETURN } from "src/modules/curius/infra/linkRepo";

type ContentChunkResponse = FailureOrSuccess<DefaultErrors, ContentChunkModel>;
type ContentChunkArrayResponse = FailureOrSuccess<
    DefaultErrors,
    ContentChunkModel[]
>;

export type ContentChunkWithDistance = ContentChunkModel & {
    averageDistance: number;
    minDistance: number;
};

export type SimilarContentChunkWithDistanceResponse = FailureOrSuccess<
    DefaultErrors,
    ContentChunkWithDistance[]
>;

export class PostgresContentChunkRepository {
    constructor(private model: typeof ContentChunkModel) {}

    private get repo(): Repository<ContentChunkModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ContentChunkModel>
    ): Promise<ContentChunkArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<ContentChunkModel>
    ): Promise<ContentChunkResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("ContentChunk not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByContentChunkname(
        username: string
    ): Promise<ContentChunkArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<ContentChunkModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<ContentChunkResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("ContentChunk not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<ContentChunkArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<ContentChunkResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("ContentChunk not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<ContentChunkModel>,
        dbTxn?: EntityManager
    ): Promise<ContentChunkResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("ContentChunk does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<ContentChunkModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(ContentChunkModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(
                    new NotFoundError("ContentChunk update failed.")
                );
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: ContentChunkModel): Promise<ContentChunkResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<ContentChunkResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("ContentChunk does not exist!")
                );
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<ContentChunkModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<ContentChunkResponse> {
        try {
            const newContentChunk = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newContentChunk);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    insert = async (
        contentChunks: Partial<ContentChunkModel>[],
        dbTxn?: EntityManager
    ): Promise<ContentChunkArrayResponse> => {
        return Helpers.trySuccessFail(async () => {
            const newContentChunks = dbTxn
                ? await dbTxn.save(this.model, contentChunks)
                : await this.repo.save(contentChunks);

            return success(newContentChunks);
        });
    };

    async findSimilarContentChunk(
        vector: number[],
        limit: number = DEFAULT_LINKS_RETURN
    ): Promise<SimilarContentChunkWithDistanceResponse> {
        try {
            const result = await this.repo
                .createQueryBuilder("contentchunk")
                .select("contentchunk")
                .addSelect(
                    "AVG(contentchunk.embedding <-> :embedding)",
                    "average_distance"
                )
                .addSelect(
                    "MIN(contentchunk.embedding <-> :embedding)",
                    "min_distance"
                )
                .setParameter("embedding", pgvector.toSql(vector))
                .groupBy("contentchunk.id")
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
