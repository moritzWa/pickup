import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import { contentRepo, contentSessionRepo, feedRepo } from "../infra";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    hasValue,
    success,
} from "src/core/logic";
import { In } from "typeorm";
import { groupBy, keyBy, uniqBy } from "lodash";
import { pgUserRepo, relationshipRepo } from "src/modules/users/infra/postgres";
import { ContentService } from "./contentService";

const getFeed = async (
    user: User,
    limit: number,
    page: number
): Promise<FailureOrSuccess<DefaultErrors, Content[]>> => {
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

    // idk why but I need this otherwise the frontend sometimes has dup ids?
    const uniqContent = uniqBy(content, (c) => c.id);

    const finalContent = await ContentService.decorateContentWithFriends(
        user,
        uniqContent
    );

    return finalContent;
};

export const FeedService = {
    getFeed,
};
