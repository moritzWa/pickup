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
import { pgRelationshipRepo } from "../infra";
import { capitalize } from "lodash";
import { Relationship, User } from "src/core/infra/postgres/entities";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import { Slack, SlackChannel } from "src/utils";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { In } from "typeorm";
import { isProduction } from "src/config";

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
    if (usersWithName.length > 0) {
        if (!user?.username) {
            return failure(
                new Error(
                    "This username is already taken. Please enter another one."
                )
            );
        } else if (usersWithName.some((u) => u.id !== user.id)) {
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
    pgRelationshipRepo.getFollowersAndFollowing(userId);

const getFollowersAndFollowingFromUsername = (username: string) =>
    pgRelationshipRepo.getFollowersAndFollowingFromUsername(username);

const followUser = async (
    toUser: User,
    fromUser: User,
    notifyOnBuy?: boolean
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    if (toUser.id === fromUser.id) {
        return failure(new Error("You cannot follow yourself."));
    }

    // create relationship
    const createResp = await pgRelationshipRepo.create({
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        notifyOnBuy: notifyOnBuy ?? false,
    });
    if (createResp.isFailure()) {
        return failure(createResp.error);
    }

    // send notification
    await NotificationService.sendNotification(toUser, {
        title: `${fromUser.name || ""} (@${fromUser.username || ""})`,
        subtitle: `followed you on Movement`,
        iconImageUrl: null,
        followerUserId: fromUser.id,
    });
    // const notificationResp = await NotificationService.create({
    //     title: `${fromUser.name} (@${fromUser.username}) followed you`,
    //     subtitle: "",
    //     iconImageUrl: null,
    //     userId: toUser.id, // to the person who got followed
    // });
    // if (notificationResp.isFailure()) {
    //     // log to slack but don't return failure
    //     await Slack.send({
    //         message: `Error sending notification for followUser: ${notificationResp.error.message}`,
    //         channel: SlackChannel.TradingNever,
    //     });
    // }

    return success(null);
};

const followFounders = async (fromUser: User) => {
    if (!isProduction()) return;

    const yashId = "50a3fbc5-4202-4f2d-9098-1e6e25d121f9";
    const andrewId = "7aeb1899-cd0e-4566-9a70-70334b2cd70c";

    // get founders
    const foundersResp = await UserService.find({
        where: {
            id: In([yashId, andrewId]),
        },
    });
    if (foundersResp.isFailure()) return failure(foundersResp.error);
    const founders = foundersResp.value;

    // create relationships
    for (const founder of founders) {
        const followUserResp = await followUser(founder, fromUser);
        // don't throw if error
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

    const deleteResp = await pgRelationshipRepo.delete(fromUserId, toUserId);
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
    const relationshipResp = await pgRelationshipRepo.findOne({
        where: {
            fromUserId,
            toUserId,
        },
    });
    if (relationshipResp.isFailure()) return failure(relationshipResp.error);
    const relationship = relationshipResp.value;
    if (notifyOnBuy === relationship.notifyOnBuy) return success(relationship);

    // update
    const updateResp = await pgRelationshipRepo.update(relationship.id, {
        notifyOnBuy: !relationship.notifyOnBuy,
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
    const response = await pgRelationshipRepo.findFollowersWithNotifications(
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
    relationships: pgRelationshipRepo,
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
