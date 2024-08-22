import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    InsertResult,
    Repository,
} from "typeorm";

import {
    success,
    failure,
    Maybe,
    UnexpectedError,
    NotFoundError,
} from "src/core/logic";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { Relationship } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { pgUserRepo } from "src/modules/users/infra/postgres";

type RelationshipParams = Omit<
    Relationship,
    "createdAt" | "updatedAt" | "id" | "toUser" | "fromUser"
>;
type RelationshipResponse = FailureOrSuccess<DefaultErrors, Relationship>;
type RelationshipArrayResponse = FailureOrSuccess<
    DefaultErrors,
    Relationship[]
>;

export class PostgresRelationshipRepository {
    constructor(private model: typeof Relationship) {}

    private get repo(): Repository<Relationship> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<Relationship>
    ): Promise<RelationshipArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    isFollowing = async (
        userId: string,
        myUserId: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> => {
        return Helpers.trySuccessFail(async () => {
            const relationship = await this.repo.exists({
                where: {
                    fromUserId: myUserId,
                    toUserId: userId,
                },
            });

            return success(relationship);
        });
    };

    async findFollowersWithNotifications(
        userId: string,
        options: FindManyOptions<Relationship>
    ): Promise<RelationshipArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    toUserId: userId,
                },
            });

            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<Relationship>
    ): Promise<RelationshipResponse> {
        try {
            const obj = await this.repo.findOne(options);
            if (!obj)
                return failure(new NotFoundError("Relationship not found."));
            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async getFollowersAndFollowing(userId: string): Promise<
        FailureOrSuccess<
            DefaultErrors,
            {
                followers: Relationship[];
                following: Relationship[];
                numFollowers: number;
                numFollowing: number;
            }
        >
    > {
        return Helpers.trySuccessFail(async () => {
            const relevantRelationships = await this.repo.find({
                where: [
                    {
                        fromUserId: userId,
                    },
                    {
                        toUserId: userId,
                    },
                ],
                relations: {
                    fromUser: false,
                    toUser: false,
                },
            });
            const following = relevantRelationships.filter(
                (r) => r.fromUserId === userId
            );
            const followers = relevantRelationships.filter(
                (r) => r.toUserId === userId
            );

            return success({
                followers,
                following,
                numFollowers: followers.length,
                numFollowing: following.length,
            });
        });
    }

    // get userIds I am following
    usersFollowing = async (
        userId: string
    ): Promise<FailureOrSuccess<DefaultErrors, string[]>> => {
        return Helpers.trySuccessFail(async () => {
            const relationships = await this.repo.find({
                where: {
                    fromUserId: userId,
                },
                select: ["toUserId"],
            });

            const followingUserIds = relationships.map((r) => r.toUserId);
            return success(followingUserIds);
        });
    };
    async getFollowersCount(
        userId: string
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const count = await this.repo.count({
                where: {
                    toUserId: userId,
                },
            });

            return success(count);
        });
    }

    async getFollowersAndFollowingFromUsername(username: string): Promise<
        FailureOrSuccess<
            DefaultErrors,
            {
                followers: Relationship[];
                following: Relationship[];
                numFollowers: number;
                numFollowing: number;
            }
        >
    > {
        return Helpers.trySuccessFail(async () => {
            console.log("Getting user for username: ", username);
            // get user
            const userResp = await pgUserRepo.findOne({
                where: {
                    username,
                },
            });
            if (userResp.isFailure()) {
                return failure(userResp.error);
            }
            const user = userResp.value;

            // followers + following
            return this.getFollowersAndFollowing(user.id);
        });
    }

    async create(
        params: RelationshipParams,
        dbTxn?: EntityManager
    ): Promise<RelationshipResponse> {
        try {
            const newRelationship = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newRelationship);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        id: string,
        updates: Partial<Relationship>,
        dbTxn?: EntityManager
    ): Promise<RelationshipResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id }, updates)
                : await this.repo.update(id, updates);

            const obj = dbTxn
                ? await dbTxn.findOneBy(this.model, { id })
                : await this.repo.findOneBy({ id });

            if (!obj) {
                return failure(
                    new NotFoundError("Relationship does not exist!")
                );
            }

            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async delete(
        fromUserId: string,
        toUserId: string
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const deleteResult = await this.repo.delete({
                fromUserId,
                toUserId,
            });
            return success(deleteResult.affected);
        });
    }
}
