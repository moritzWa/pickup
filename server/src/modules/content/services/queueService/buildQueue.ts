import { connect } from "src/core/infra/postgres";
import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
} from "src/core/logic";
import { authorRepo } from "src/modules/author/infra";
import { curiusLinkRepo } from "src/modules/curius/infra";
import {
    DEFAULT_LINKS_RETURN,
    LinkWithDistance,
} from "src/modules/curius/infra/linkRepo";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { AudioService } from "src/shared/audioService";
import { v4 as uuidv4 } from "uuid";
import { contentRepo, feedRepo } from "../../infra";
import moment = require("moment");

// needs to be idempotent
export const buildQueue = async (
    user: User,
    limit: number
): Promise<FailureOrSuccess<DefaultErrors, FeedItem[]>> => {
    const categories = user.interestCategories.join(" ");
    const description = user.interestDescription;
    const rawQuery = `${categories} ${description}`;

    const similarLinksResponse = await curiusLinkRepo.findSimilarLinks(
        rawQuery,
        limit ?? DEFAULT_LINKS_RETURN
    );

    if (similarLinksResponse.isFailure()) {
        return failure(similarLinksResponse.error);
    }

    const links = similarLinksResponse.value;

    const contentIdsResponse = await Promise.all(
        links.map(convertCuriusToContent)
    );

    const failures = contentIdsResponse.filter((r) => r.isFailure());

    if (failures.length > 0) {
        return failure(failures[0].error);
    }

    const contentIds = contentIdsResponse.map((r) => r.value);

    if (!contentIds.length) {
        return success([]);
    }

    const contentResponse = await contentRepo.findByIds(contentIds);

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const content = contentResponse.value;

    const queueResponse = await buildQueueFromContent(user, content);

    return queueResponse;
};

const buildQueueFromContent = async (
    user: User,
    content: Content[]
): Promise<FailureOrSuccess<DefaultErrors, FeedItem[]>> => {
    // TODO: we need to then make a queue here
    const queueResponses = await Promise.all(
        content.map((c, i) =>
            feedRepo.create({
                id: uuidv4(),
                position: i,
                isQueued: false,
                isArchived: false,
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
        isProcessed: false,
        thumbnailImageUrl: "",
        authors: [], // This will be updated later
        embedding: null,
        sourceImageUrl: "",
        referenceId: null, // Add this line
        releasedAt: new Date(), // Add this line
        lengthMs: 0,
        categories: [],
        summary: link.snippet || "",
        followUpQuestions: [],
        title: link.title,
        websiteUrl: link.link,
        createdAt: new Date(),
        updatedAt: new Date(),
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

            const queue = await buildQueue(userResponse.value, 1);

            debugger;
        })
        .then(() => process.exit(0));
}
