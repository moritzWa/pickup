import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import { throwIfErrorAndDatadog } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";
import {
    uniqueNamesGenerator,
    adjectives,
    animals,
    NumberDictionary,
} from "unique-names-generator";
import { capitalize } from "lodash";
import { Relationship, User } from "src/core/infra/postgres/entities";
import { Slack, SlackChannel } from "src/utils";
import { pgUserRepo, relationshipRepo } from "src/modules/users/infra/postgres";
import { In } from "typeorm";
import { isProduction } from "src/config";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import { NotificationType } from "src/core/infra/postgres/entities/Notification";

const generateUsername = () => {
    while (true) {
        // ex. "soviet frog 41"
        const str = uniqueNamesGenerator({
            dictionaries: [
                adjectives,
                animals,
                NumberDictionary.generate({ min: 0, max: 99 }),
            ],
            separator: " ",
        });

        const name = str
            .split(" ")
            .slice(0, 2)
            .map((word) => capitalize(word))
            .join(" ");

        const username = str.replace(/ /g, "").toLowerCase();

        if (name.toLowerCase().startsWith("gay")) continue;

        return { username, name };
    }
};

const sanitizeUsername = (username: Maybe<string> | undefined) =>
    (username || "").trim();

const checkValidUsername = async (
    username: string,
    user: Maybe<User>
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    // const username = sanitizeUsername(_username); - do NOT sanitize username. A username with spaces should be invalid.

    if (
        user?.username &&
        user.username.toLowerCase() === username.toLowerCase()
    ) {
        // do NOT let username param be sanitized. Otherwise we would check if sanitized version is equal to user.username here
        return success(null);
    }

    if (username.length === 0) {
        return failure(new Error("Username cannot be empty."));
    }

    // alphanumeric and underscore only
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return failure(
            new Error(
                "Username can only contain letters, numbers, and underscores."
            )
        );
    }

    // username exists
    const usersWithNameResp = await pgUserRepo.findByUsername(username);
    if (usersWithNameResp.isFailure()) return failure(usersWithNameResp.error);
    const usersWithName = usersWithNameResp.value;

    // there is already a user with this username and it's not the current user
    if (usersWithName) {
        if (!user?.username) {
            return failure(
                new Error(
                    "This username is already taken. Please enter another one."
                )
            );
        } else if (usersWithName.id !== user.id) {
            return failure(
                new Error(
                    "This username is already taken. Please enter another one."
                )
            );
        }
    }

    return success(null);
};

const getFollowersAndFollowing = (userId: string) =>
    relationshipRepo.getFollowersAndFollowing(userId);

const getFollowersAndFollowingFromUsername = (username: string) =>
    relationshipRepo.getFollowersAndFollowingFromUsername(username);

const followUser = async (
    toUser: User,
    fromUser: User,
    sendNotification = true
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    if (toUser.id === fromUser.id) {
        return failure(new Error("You cannot follow yourself."));
    }

    // create relationship
    const createResp = await relationshipRepo.create({
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        lastCheckedAt: null,
    });

    if (createResp.isFailure()) {
        return failure(createResp.error);
    }

    // send notification
    await NotificationService.sendNotification(
        toUser,
        {
            title: `${fromUser.name || ""} (@${fromUser.username || ""})`,
            subtitle: `followed you`,
            iconImageUrl: null,
            followerUserId: fromUser.id,
            type: NotificationType.GainedFollower,
            feedInsertionId: null,
        },
        sendNotification
    );

    return success(null);
};

const followFounders = async (fromUser: User) => {
    if (!isProduction()) return;

    const moritzId = "a0683da2-d8eb-4631-a759-1d98256e9345";
    const andrewId = "50a64961-19bf-4487-8657-226c43c6a26e";

    // get founders
    const foundersResp = await UserService.find({
        where: {
            id: In([moritzId, andrewId]),
        },
    });

    if (foundersResp.isFailure()) return failure(foundersResp.error);

    const founders = foundersResp.value;

    // create relationships
    for (const founder of founders) {
        await followUser(founder, fromUser, true);
        await followUser(fromUser, founder, false);
    }

    return;
};

const unfollowUser = async (
    toUserId: string,
    fromUserId: string
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    if (toUserId === fromUserId) {
        return failure(new Error("You cannot follow yourself."));
    }

    const deleteResp = await relationshipRepo.delete(fromUserId, toUserId);
    if (deleteResp.isFailure()) return failure(deleteResp.error);

    return success(null);
};

type ToggleNotifyOnBuyParams = {
    toUserId: string;
    fromUserId: string;
    notifyOnBuy: boolean;
};

const toggleNotifyOnBuy = async ({
    toUserId,
    fromUserId,
    notifyOnBuy,
}: ToggleNotifyOnBuyParams): Promise<
    FailureOrSuccess<DefaultErrors, Relationship>
> => {
    // get
    const relationshipResp = await relationshipRepo.findOne({
        where: {
            fromUserId,
            toUserId,
        },
    });
    if (relationshipResp.isFailure()) return failure(relationshipResp.error);
    const relationship = relationshipResp.value;

    // update
    const updateResp = await relationshipRepo.update(relationship.id, {
        // TODO:
    });
    if (updateResp.isFailure()) return failure(updateResp.error);
    const newRelationship = updateResp.value;

    return success(newRelationship);
};

const getFollowersToNotifyOnBuy = async (
    userId: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        Pick<User, "id" | "hasPushNotificationsEnabled">[]
    >
> => {
    const response = await relationshipRepo.findFollowersWithNotifications(
        userId,
        {
            relations: {
                fromUser: true,
            },
            select: {
                fromUser: { id: true, hasPushNotificationsEnabled: true },
            },
        }
    );

    if (response.isFailure()) {
        return failure(response.error);
    }

    const relationships = response.value;

    return success(relationships.map((r) => r.fromUser));
};

export const ProfileService = {
    followUser,
    followFounders,
    unfollowUser,
    generateUsername,
    sanitizeUsername,
    checkValidUsername,
    getFollowersAndFollowing,
    getFollowersAndFollowingFromUsername,
    toggleNotifyOnBuy,
    getFollowersToNotifyOnBuy,
};
