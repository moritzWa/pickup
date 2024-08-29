import {
    Content,
    ContentSession,
    User,
} from "src/core/infra/postgres/entities";
import { contentSessionRepo } from "../infra";
import { DefaultErrors, FailureOrSuccess } from "src/core/logic";
import { v4 as uuidv4 } from "uuid";

const findOrCreate = async (
    content: Content,
    user: User
): Promise<FailureOrSuccess<DefaultErrors, ContentSession>> => {
    const existingSessionResponse =
        await contentSessionRepo.findForContentAndUser({
            userId: user.id,
            contentId: content.id,
        });

    if (existingSessionResponse.isSuccess() && existingSessionResponse.value) {
        return existingSessionResponse;
    }

    const sessionResponse = await contentSessionRepo.create({
        id: uuidv4(),
        isBookmarked: false,
        isLiked: false,
        isDisliked: false,
        contentId: content.id,
        userId: user.id,
        currentMs: 0,
        durationMs: content.lengthMs,
        createdAt: new Date(),
        lastListenedAt: new Date(),
        bookmarkedAt: null,
        dislikedAt: null,
        updatedAt: new Date(),
        notes: null,
        percentFinished: null,
    });

    return sessionResponse;
};

export const ContentSessionService = {
    findOrCreate,
};
