import { orderBy, uniq } from "lodash";
import { connect } from "src/core/infra/postgres";
import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
} from "src/core/logic";
import { authorRepo } from "src/modules/author/infra";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { LinkWithDistance } from "src/modules/curius/infra/linkRepo";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { AudioService } from "src/shared/audioService";
import { v4 as uuidv4 } from "uuid";
import {
    contentRepo,
    contentSessionRepo,
    feedRepo,
    interactionRepo,
} from "../../infra";
import { ContentWithDistance } from "../../infra/contentRepo";
import { ContentService } from "../contentService";
import moment = require("moment");
import { In } from "typeorm";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";

// needs to be idempotent
export const buildQueue = async (
    user: User,
    limit: number
): Promise<FailureOrSuccess<DefaultErrors, FeedItem[]>> => {
    const categories = user.interestCategories.join(" ");
    const description = user.interestDescription;

    const feedResponse = await feedRepo.findForUser(user.id, {
        select: { contentId: true },
    });

    if (feedResponse.isFailure()) {
        return failure(feedResponse.error);
    }

    // v0 is just get content interacted with
    const recentlyLikedContentResponse = await interactionRepo.find({
        where: {
            userId: user.id,
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

    const contentResponse = await contentRepo.findByIds(
        recentlyLikedContentIds,
        {
            select: { embedding: true },
        }
    );

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const recentlyLikedContent = contentResponse.value;

    const queries = [
        (description || "").slice(0, 4_000),
        ...user.interestCategories.map((c) => c.toLowerCase()),
    ].filter((v) => !!v);

    const allContent: { content: ContentWithDistance[]; query: string }[] = [];

    // FIXME: at some point maybe cache these bc they cost money to do
    for (const query of queries) {
        const similarContentResponse =
            await ContentService.getSimilarContentFromQuery(user, query, 10);

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
            10
        );

        if (similarContentResponse.isFailure()) {
            continue;
        }

        allContent.push({
            content: similarContentResponse.value,
            query: `Content like: ${content.title}`,
        });
    }

    // relevant to not as relevant
    const rankedContent = orderBy(
        allContent.flatMap((c) => c.content),
        (c) => c.averageDistance,
        "asc"
    ).slice(0, limit);

    debugger;

    const queueResponse = await buildQueueFromContent(user, rankedContent);

    return queueResponse;
};

const buildQueueFromContent = async (
    user: User,
    content: Content[]
): Promise<FailureOrSuccess<DefaultErrors, FeedItem[]>> => {
    const queueResponses = await Promise.all(
        content.reverse().map((c, i) =>
            feedRepo.create({
                id: uuidv4(),
                position: Date.now() + i, // date + the index
                isQueued: false,
                isArchived: false,
                queuedAt: null,
                userId: user.id,
                contentId: c.id,
                // make it so increasing time? maybe
                createdAt: moment().add({ milliseconds: i }).toDate(),
                updatedAt: moment().add({ milliseconds: i }).toDate(),
            })
        )
    );

    const queueFailures = queueResponses.filter((r) => r.isFailure());

    if (queueFailures.length > 0) {
        return failure(queueFailures[0].error);
    }

    const queue = queueResponses.map((r) => r.value);

    return success(queue);
};

const convertCuriusToContent = async (
    link: LinkWithDistance
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    if (link.contentId) {
        return success(link.contentId);
    }

    // chunk the full text into less than 4000 characters long but make sure they are full words (no spaces)

    // try to get audio
    const audioResponse = await AudioService.generate(link.fullText || "");

    if (audioResponse.isFailure()) {
        return failure(audioResponse.error);
    }

    const audio = audioResponse.value;

    const contentId = uuidv4();

    // Create the Content object first
    const contentResponse = await contentRepo.create({
        id: contentId,
        insertionId: null,
        audioUrl: audio.url,
        context: "",
        contentAsMarkdown: link.fullText || "",
        content: link.fullText || "",
        isProcessed: false,
        thumbnailImageUrl: "",
        authors: [], // This will be updated later
        embedding: null,
        sourceImageUrl: "",
        referenceId: null,
        releasedAt: link.createdDate,
        lengthMs: 0,
        categories: [],
        summary: link.snippet || "",
        followUpQuestions: [],
        title: link.title,
        websiteUrl: link.link,
        chunks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        type: ContentType.ARTICLE,
        ogDescription: null,
    });

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const content = contentResponse.value;

    // Create the authors with the Content object included in the contents array
    const authors = await Promise.all(
        (link.byline ? [link.byline] : []).map(async (name) => {
            const authorResponse = await authorRepo.create({
                id: uuidv4(),
                name,
                imageUrl: null,
                contents: [content], // Pass the Content object here
            });
            if (authorResponse.isFailure()) {
                throw new Error(authorResponse.error.message);
            }
            return authorResponse.value;
        })
    );

    // Update the Content object with the created authors
    content.authors = authors;
    await contentRepo.save(content);

    // update the link to link to the content now
    await curiusLinkRepo.update(link.id, {
        contentId: content.id,
    });

    return success(content.id);
};

// test the build queue
if (require.main === module) {
    void connect()
        .then(async () => {
            const userResponse = await pgUserRepo.findByEmail(
                "andrew.j.duca@gmail.com"
            );

            debugger;

            const queue = await buildQueue(userResponse.value, 1);

            debugger;
        })
        .then(() => process.exit(0));
}
