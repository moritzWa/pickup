import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import { contentRepo, contentSessionRepo, feedRepo } from "../infra";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    hasValue,
    success,
} from "src/core/logic";
import { In, IsNull, MoreThan, Not } from "typeorm";
import { groupBy, keyBy, uniqBy } from "lodash";
import { pgUserRepo, relationshipRepo } from "src/modules/users/infra/postgres";
import { ContentService } from "./contentService";
import { ContentFeedFilterEnum } from "src/core/infra/postgres/entities/FeedItem";
import { ContentWithDistance } from "../infra/contentRepo";
import moment from "moment";

const getFriendFeedForUser = async (
    user: User,
    limit: number,
    page: number
): Promise<FailureOrSuccess<DefaultErrors, Content[]>> => {
    const relationshipResponse = await relationshipRepo.usersFollowing(user.id);

    if (relationshipResponse.isFailure()) {
        return failure(relationshipResponse.error);
    }

    const userIdsFollowing = relationshipResponse.value;

    const recentContentFromFriendsResponse = await contentSessionRepo.find({
        where: {
            userId: In(userIdsFollowing),
            // percentFinished: MoreThan(10)
        },
        order: {
            lastListenedAt: "desc",
        },
        select: {
            id: true,
            userId: true,
            contentId: true,
        },
        take: limit,
        skip: page * limit,
    });

    if (recentContentFromFriendsResponse.isFailure()) {
        return failure(recentContentFromFriendsResponse.error);
    }

    const contentResponse = await contentRepo.findByIds(
        recentContentFromFriendsResponse.value.map((i) => i.contentId)
    );

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const content = contentResponse.value;

    const finalContent = await ContentService.decorateContentWithFriends(
        user,
        content
    );

    return finalContent;
};

const getRelevantNewContent = async (
    user: User,
    limit: number,
    page: number
): Promise<FailureOrSuccess<DefaultErrors, Content[]>> => {
    // const queries = [
    //     (user.interestDescription || "").slice(0, 4_000),
    //     (user.description || "").slice(0, 4_000),
    //     ...user.interestCategories.map((c) => c.toLowerCase()),
    // ].filter((v) => !!v);

    const contentResponse = await contentRepo.find({
        where: {
            isProcessed: true,
            audioUrl: Not(IsNull()),
            releasedAt: Not(IsNull()),
        },
        order: {
            releasedAt: "desc",
        },
        take: limit,
        skip: page * limit,
    });

    const content = contentResponse.value;

    const finalContent = await ContentService.decorateContentWithFriends(
        user,
        content
    );

    return finalContent;
};

const getFeed = async (
    user: User,
    limit: number,
    page: number,
    filter?: ContentFeedFilterEnum | null
): Promise<FailureOrSuccess<DefaultErrors, Content[]>> => {
    if (filter === ContentFeedFilterEnum.Friends) {
        return getFriendFeedForUser(user, limit, page);
    }

    if (filter === ContentFeedFilterEnum.New) {
        return getRelevantNewContent(user, limit, page);
    }

    const [feedResponse] = await Promise.all([
        feedRepo.findForUser(user.id, {
            where: { isArchived: false },
            take: limit ?? 0,
            skip: page * limit,
            order: {
                position: "desc",
                createdAt: "desc",
            },
        }),
    ]);

    if (feedResponse.isFailure()) {
        return failure(feedResponse.error);
    }

    const feed = feedResponse.value;

    if (!feed.length) {
        return success([]);
    }

    // FIXME: hacky bc the typeorm joins are annoying
    // Note: using this repo function bc that way it doesn't join the content under the
    // authors which makes the query superrr slow
    const contentResponse = await contentRepo.findForIdsWithAuthor(
        feedResponse.value.map((c) => c.contentId)
    );

    // console.log(contentResponse.value);

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    // Note: just doing in memory, lil easier than fiddling with typeorm

    const contentIds = feedResponse.value.map((c) => c.contentId);

    const contentSessionsResponse = await contentSessionRepo.find({
        where: {
            userId: user.id,
            contentId: In(contentIds),
        },
    });

    if (contentSessionsResponse.isFailure()) {
        return failure(contentSessionsResponse.error);
    }

    const sessionByContentId = keyBy(
        contentSessionsResponse.value,
        (cs) => cs.contentId
    );

    const contentByContentId = keyBy(contentResponse.value, (c) => c.id);

    const content = feedResponse.value.map((c) => {
        const session = sessionByContentId[c.contentId];
        const content = contentByContentId[c.contentId];

        return {
            ...content,
            contentSession: session,
        };
    });

    console.log(content.map((c) => c.id));

    const finalContent = await ContentService.decorateContentWithFriends(
        user,
        content
    );

    return finalContent;
};

export const FeedService = {
    getFeed,
};
