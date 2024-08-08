import { Content, Queue, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
} from "src/core/logic";
import { curiusLinkRepo } from "src/modules/curius/infra";
import {
    DEFAULT_LINKS_RETURN,
    LinkWithDistance,
} from "src/modules/curius/infra/linkRepo";
import { contentRepo, queueRepo } from "../../infra";
import { v4 as uuidv4 } from "uuid";
import { firebase, openai } from "src/utils";
import { storage } from "firebase-admin";
import moment = require("moment");

// needs to be idempotent
export const buildQueue = async (
    user: User,
    limit: number
): Promise<FailureOrSuccess<DefaultErrors, Queue[]>> => {
    const categories = user.interestCategories.join(" ");
    const description = user.interestDescription;
    const query = `${categories} ${description}`;

    const similarLinksResponse = await curiusLinkRepo.findSimilarLinks(
        query,
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
): Promise<FailureOrSuccess<DefaultErrors, Queue[]>> => {
    // TODO: we need to then make a queue here
    const queueResponses = await Promise.all(
        content.map((c, i) =>
            queueRepo.create({
                id: uuidv4(),
                position: i,
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

    // try to get audio
    const audioResponse = await openai.audio.speak({
        text: link.fullText || "",
        voice: "onyx",
        model: "tts-1",
    });

    if (audioResponse.isFailure()) {
        return failure(audioResponse.error);
    }

    const audio = audioResponse.value;

    // need to write this to firebase
    const uploadResponse = await firebase.storage.uploadBuffer(
        audio,
        "audio/mp3"
    );

    if (uploadResponse.isFailure()) {
        return failure(uploadResponse.error);
    }

    const upload = uploadResponse.value;

    const contentResponse = await contentRepo.create({
        id: uuidv4(),
        audioUrl: upload.originalUrl,
        context: "",
        thumbnailImageUrl: "",
        authorImageUrl: "",
        sourceImageUrl: "",
        lengthMs: 0,
        categories: [],
        authorName: "",
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

    // update the link to link to the content now
    await curiusLinkRepo.update(link.id, {
        contentId: content.id,
    });

    return success(content.id);
};
