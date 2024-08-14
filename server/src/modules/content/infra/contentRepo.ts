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
import { Content as ContentModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { DEFAULT_LINKS_RETURN } from "src/modules/curius/infra/linkRepo";

type ContentResponse = FailureOrSuccess<DefaultErrors, ContentModel>;
type ContentArrayResponse = FailureOrSuccess<DefaultErrors, ContentModel[]>;

export type ContentWithDistance = ContentModel & {
    averageDistance: number;
    minDistance: number;
};

export type SimilarContentWithDistanceResponse = FailureOrSuccess<
    DefaultErrors,
    ContentWithDistance[]
>;

export class PostgresContentRepository {
    constructor(private model: typeof ContentModel) {}

    private get repo(): Repository<ContentModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ContentModel>
    ): Promise<ContentArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<ContentModel>
    ): Promise<ContentResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user) return failure(new NotFoundError("Content not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByContentname(username: string): Promise<ContentArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<ContentModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<ContentResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("Content not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<ContentArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<ContentResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("Content not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<ContentModel>,
        dbTxn?: EntityManager
    ): Promise<ContentResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(new NotFoundError("Content does not exist!"));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<ContentModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(ContentModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("Content update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: ContentModel): Promise<ContentResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<ContentResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(new NotFoundError("Content does not exist!"));
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<ContentModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<ContentResponse> {
        try {
            const newContent = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newContent);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    bulkInsert = async (
        contents: Omit<ContentModel, "accounts">[]
    ): Promise<FailureOrSuccess<DefaultErrors, ContentModel[]>> => {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.save(contents);
            return success(res);
        });
    };

    async findSimilarContent(
        vector: number[],
        limit: number = DEFAULT_LINKS_RETURN
    ): Promise<SimilarContentWithDistanceResponse> {
        try {
            const result = await this.repo
                .createQueryBuilder("content")
                .select("content")
                .addSelect(
                    "AVG(content.embedding <-> :embedding)",
                    "average_distance"
                )
                .addSelect(
                    "MIN(content.embedding <-> :embedding)",
                    "min_distance"
                )
                .setParameter("embedding", pgvector.toSql(vector))
                .groupBy("content.id")
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
