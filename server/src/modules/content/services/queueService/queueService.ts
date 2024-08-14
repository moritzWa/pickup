import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    NotFoundError,
    success,
} from "src/core/logic";
import { feedRepo } from "../../infra";
import { v4 as uuidv4 } from "uuid";
import { LessThan, MoreThan } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { pgUserRepo } from "src/modules/users/infra/postgres";

const current = async (
    user: User
): Promise<FailureOrSuccess<DefaultErrors, FeedItem | null>> => {
    if (!user.currentFeedItemId) {
        return success(null);
    }

    const queueResponse = await feedRepo.findById(user.currentFeedItemId);

    return queueResponse;
};

const list = async (
    user: User
): Promise<FailureOrSuccess<DefaultErrors, FeedItem[]>> => {
    const queueResponse = await feedRepo.findForUser(user.id, {
        where: { isQueued: true },
        order: {
            queuedAt: "asc",
        },
        relations: { content: true },
    });

    if (queueResponse.isFailure()) {
        return failure(queueResponse.error);
    }

    return queueResponse;
};

const setCurrent = async (
    user: User,
    queue: FeedItem
): Promise<FailureOrSuccess<DefaultErrors, User>> => {
    await pgUserRepo.update(user.id, {
        currentFeedItemId: queue.id,
    });

    return success(user);
};

export const QueueService = {
    current,
    list,
    setCurrent,
};
