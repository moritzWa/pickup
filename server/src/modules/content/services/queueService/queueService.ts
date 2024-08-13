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

const enqueue = async (
    user: User,
    contentId: string
): Promise<FailureOrSuccess<DefaultErrors, FeedItem>> => {
    const currentPositionResponse = await feedRepo.currentPosition(user.id);

    if (currentPositionResponse.isFailure()) {
        return failure(currentPositionResponse.error);
    }

    const currentPosition = currentPositionResponse.value;
    const nextPosition = currentPosition + 1;

    const queueResponse = await feedRepo.create({
        id: uuidv4(),
        isArchived: false,
        position: nextPosition,
        isQueued: true,
        userId: user.id,
        contentId,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return queueResponse;
};

const remove = async (
    user: User,
    contentId: string
): Promise<FailureOrSuccess<DefaultErrors, FeedItem>> => {
    const queueResponse = await feedRepo.findOne({
        where: {
            userId: user.id,
            contentId,
        },
    });

    if (queueResponse.isFailure()) {
        return failure(queueResponse.error);
    }

    await feedRepo.delete(queueResponse.value.id);

    return queueResponse;
};

const next = async (
    user: User,
    content: Content
): Promise<FailureOrSuccess<DefaultErrors, FeedItem>> => {
    const currentQueueResponse = await feedRepo.findOne({
        where: {
            userId: user.id,
            contentId: content.id,
        },
    });

    if (currentQueueResponse.isFailure()) {
        return failure(currentQueueResponse.error);
    }

    const currentPos = currentQueueResponse.value.position;

    const nextItemResponse = await feedRepo.find({
        where: {
            userId: user.id,
            position: MoreThan(currentPos),
        },
        take: 1,
        order: { position: "asc" },
        relations: { content: true },
    });

    throwIfError(nextItemResponse);

    const nextItem = nextItemResponse.value[0];

    if (!nextItem) {
        return failure(new NotFoundError("No next item in queue"));
    }

    return success(nextItem);
};

const prev = async (
    user: User,
    content: Content
): Promise<FailureOrSuccess<DefaultErrors, FeedItem>> => {
    const currentQueueResponse = await feedRepo.findOne({
        where: {
            userId: user.id,
            contentId: content.id,
        },
    });

    if (currentQueueResponse.isFailure()) {
        return failure(currentQueueResponse.error);
    }

    const currentPos = currentQueueResponse.value.position;

    const prevItemResponse = await feedRepo.find({
        where: {
            userId: user.id,
            position: LessThan(currentPos),
        },
        take: 1,
        order: { position: "asc" },
        relations: { content: true },
    });

    throwIfError(prevItemResponse);

    const prevItem = prevItemResponse.value[0];

    if (!prevItem) {
        return failure(new NotFoundError("No prev item in queue"));
    }

    return success(prevItem);
};

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
            position: "asc",
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
    enqueue,
    remove,
    next,
    prev,
    current,
    list,
    setCurrent,
};
