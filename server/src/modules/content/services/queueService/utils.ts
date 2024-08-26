import { orderBy, uniq, uniqBy } from "lodash";
import { Content } from "src/core/infra/postgres/entities";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { NotificationType } from "src/core/infra/postgres/entities/Notification";
import { User } from "src/core/infra/postgres/entities/User";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
} from "src/core/logic";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import { Logger } from "src/utils";
import { In } from "typeorm";
import { contentRepo, interactionRepo } from "../../infra";
import { ContentWithDistance } from "../../infra/contentRepo";
import { ContentService } from "../contentService";

export const getRecentlyLikedContent = async (
    userId: string
): Promise<FailureOrSuccess<DefaultErrors, string[]>> => {
    // v0 is just get content interacted with
    const recentlyLikedContentResponse = await interactionRepo.find({
        where: {
            userId,
            type: In([
                InteractionType.Bookmarked,
                InteractionType.Finished,
                InteractionType.ListenedToBeginning,
                InteractionType.Queued,
            ]),
        },
        select: {
            id: true,
            type: true,
            contentId: true,
        },
        order: {
            createdAt: "desc",
        },
        take: 100, // just get last 100
    });

    if (recentlyLikedContentResponse.isFailure()) {
        return failure(recentlyLikedContentResponse.error);
    }

    const recentlyLikedContentIds: string[] = uniq(
        recentlyLikedContentResponse.value.map((c) => c.contentId)
    );

    return success(recentlyLikedContentIds);
};

const getInterestQueries = (user: User) => {
    return [
        (user.interestDescription || "").slice(0, 4_000),
        ...(user.interestCategories || []).map((c) => c.toLowerCase()),
    ].filter((v) => !!v);
};

export const getSimilarPodcastsForUser = async (
    user: User,
    recentlyLikedContent: Content[],
    limit: number
): Promise<ContentWithDistance[]> => {
    const queries = getInterestQueries(user);

    const allContent: { content: ContentWithDistance[]; query: string }[] = [];

    for (const query of queries) {
        const similarContentResponse =
            await ContentService.getSimilarContentFromQuery(user, query, limit);

        if (similarContentResponse.isFailure()) {
            continue;
        }

        allContent.push({
            content: similarContentResponse.value,
            query,
        });
    }

    for (const content of recentlyLikedContent) {
        const similarContentResponse = await ContentService.getSimilarContent(
            user,
            content,
            limit
        );

        if (similarContentResponse.isFailure()) {
            continue;
        }

        allContent.push({
            content: similarContentResponse.value,
            query: `Content like: ${content.title}`,
        });
    }

    return uniqBy(
        orderBy(
            allContent.flatMap((c) => c.content),
            (c) => c.averageDistance,
            "asc"
        ),
        (c) => c.id
    );
};

export const getSimilarArticlesForUser = async (
    user: User,
    recentlyLikedArticles: Content[],
    limit: number
): Promise<ContentWithDistance[]> => {
    const queries = getInterestQueries(user);
    const allContent: { content: ContentWithDistance[]; query: string }[] = [];

    Logger.info("Getting similar articles for user", {
        user: user.id,
        recentlyLikedArticles: recentlyLikedArticles.map((a) => a.id),
    });

    for (const query of queries) {
        const similarContentResponse =
            await ContentService.getSimilarArticlesFromQuery(
                user,
                query,
                limit
            );

        if (similarContentResponse.isFailure()) {
            continue;
        }

        Logger.info(
            "Got similar articles for query",
            JSON.stringify({
                query,
                content: similarContentResponse.value,
            })
        );

        allContent.push({
            content: similarContentResponse.value,
            query,
        });
    }

    for (const article of recentlyLikedArticles) {
        const similarContentResponse = await ContentService.getSimilarArticles(
            user,
            article,
            limit
        );

        if (similarContentResponse.isFailure()) {
            continue;
        }

        Logger.info(
            "Got similar articles for liked article",
            JSON.stringify({
                article: article.id,
                content: similarContentResponse.value,
            })
        );

        allContent.push({
            content: similarContentResponse.value,
            query: `Content like: ${article.title}`,
        });
    }

    return uniqBy(
        orderBy(
            allContent.flatMap((c) => c.content),
            (c) => c.averageDistance,
            "asc"
        ),
        (c) => c.id
    );
};

export const getTopContent = async (
    limit: number
): Promise<FailureOrSuccess<DefaultErrors, ContentWithDistance[]>> => {
    const topContentResponse = await contentRepo.find({
        order: {
            releasedAt: "desc",
        },
        take: limit,
    });

    if (topContentResponse.isFailure()) {
        return failure(topContentResponse.error);
    }

    const randomContent = topContentResponse.value.map(
        (c): ContentWithDistance => ({
            ...c,
            minDistance: 1,
            averageDistance: 1,
        })
    );

    return success(randomContent);
};

export const sendNewRecommendationsNotification = async (
    user: User,
    firstTitle: string | undefined,
    insertionId: string
): Promise<void> => {
    await NotificationService.sendNotification(
        user,
        {
            title: `New podcast reccs ready ✨`,
            subtitle: `${firstTitle || "View now"}`,
            iconImageUrl: null,
            followerUserId: null,
            type: NotificationType.NewRecommendations,
            feedInsertionId: insertionId,
        },
        true
    );
};
