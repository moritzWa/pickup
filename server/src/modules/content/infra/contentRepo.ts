import * as pgvector from "pgvector/pg";
import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    In,
    IsNull,
    Not,
    Raw,
    Repository,
} from "typeorm";

import { dataSource } from "src/core/infra/postgres";
import {
    ContentChunk,
    Content as ContentModel,
} from "src/core/infra/postgres/entities";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { NotFoundError, UnexpectedError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { DEFAULT_LINKS_RETURN } from "src/modules/curius/infra/linkRepo";
import { Helpers } from "src/utils";

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

    // FINDERS

    async find(
        options: FindManyOptions<ContentModel>
    ): Promise<ContentArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    findForIdsWithAuthor = async (
        ids: string[]
    ): Promise<FailureOrSuccess<DefaultErrors, ContentModel[]>> => {
        try {
            const contentResponse = await this.repo
                .createQueryBuilder("content")
                .leftJoinAndSelect("content.authors", "author")
                .where("content.id IN (:...ids)", { ids })
                .getMany();

            return success(contentResponse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

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

    // get best content to add full text
    async filterBestContentWithoutFullText(
        limit: number,
        skip: number
    ): Promise<ContentArrayResponse> {
        try {
            const links = await this.repo.find({
                where: {
                    content: IsNull(),
                    skippedErrorFetchingFullText: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    skippedNotProbablyReadable: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    skippedInaccessiblePDF: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    deadLink: Raw((alias) => `${alias} IS NOT TRUE`),

                    // get all articles that are not yet pod
                    audioUrl: IsNull(),
                },
                take: limit,
                skip,
                order: {
                    createdAt: "asc",
                },
            });
            return success(links);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async filterContentWithoutThumbnail(): Promise<ContentArrayResponse> {
        try {
            const contents = await this.repo.find({
                where: {
                    thumbnailImageUrl: IsNull(),
                    // skip bad links
                    skippedErrorFetchingFullText: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    skippedNotProbablyReadable: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    skippedInaccessiblePDF: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    deadLink: Raw((alias) => `${alias} IS NOT TRUE`),

                    // get all articles that are not yet pod
                    audioUrl: IsNull(),
                },
                order: {
                    createdAt: "asc",
                },
            });
            return success(contents);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findById(
        userId: string,
        opts?: FindOneOptions<ContentModel>
    ): Promise<ContentResponse> {
        try {
            const user = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id: userId },
            });

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

    async findSimilarContentFromChunks(
        vector: number[],
        limit: number = DEFAULT_LINKS_RETURN,
        idsToExclude: string[]
    ): Promise<SimilarContentWithDistanceResponse> {
        try {
            const result = await this.repo
                .createQueryBuilder("content")
                .select("content")
                .addSelect(
                    "AVG(chunks.embedding <-> :embedding)",
                    "average_distance"
                )
                .addSelect(
                    "MIN(chunks.embedding <-> :embedding)",
                    "min_distance"
                )
                .innerJoin(
                    ContentChunk,
                    "chunks",
                    "content.id = chunks.content_id"
                )
                .where({
                    id: Not(In(idsToExclude)),
                })
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

    async findSimilarContent(
        vector: number[],
        limit: number = DEFAULT_LINKS_RETURN,
        idsToExclude: string[]
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
                .where({
                    id: Not(In(idsToExclude)),
                })
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

    // SAVES

    async save(obj: ContentModel): Promise<ContentResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async saveMany(
        contents: ContentModel[]
    ): Promise<FailureOrSuccess<DefaultErrors, ContentModel[]>> {
        try {
            return success(
                await this.repo.save(contents, {
                    chunk: 1,
                })
            );
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // UPDATES

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

    async countContentsWithoutFullText(): Promise<
        FailureOrSuccess<DefaultErrors, number>
    > {
        try {
            const count = await this.repo.count({
                where: {
                    content: IsNull(),
                    skippedErrorFetchingFullText: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    skippedNotProbablyReadable: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    skippedInaccessiblePDF: Raw(
                        (alias) => `${alias} IS NOT TRUE`
                    ),
                    deadLink: Raw((alias) => `${alias} IS NOT TRUE`),

                    // get all articles that are not yet pod
                    audioUrl: IsNull(),
                },
            });
            return success(count);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // CREATE & DELETE

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
}
