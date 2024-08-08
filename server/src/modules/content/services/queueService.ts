import { Queue, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    NotFoundError,
    success,
} from "src/core/logic";
import { queueRepo } from "../infra";
import { v4 as uuidv4 } from "uuid";
import { LessThan, MoreThan } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { pgUserRepo } from "src/modules/users/infra/postgres";

const enqueue = async (
    user: User,
    contentId: string
): Promise<FailureOrSuccess<DefaultErrors, Queue>> => {
    const currentPositionResponse = await queueRepo.currentPosition(user.id);

    if (currentPositionResponse.isFailure()) {
        return failure(currentPositionResponse.error);
    }

    const currentPosition = currentPositionResponse.value;
    const nextPosition = currentPosition + 1;

    const queueResponse = await queueRepo.create({
        id: uuidv4(),
        position: nextPosition,
        userId: user.id,
        contentId,
    });

    return queueResponse;
};

const remove = async (
    user: User,
    contentId: string
): Promise<FailureOrSuccess<DefaultErrors, Queue>> => {
    const queueResponse = await queueRepo.findOne({
        where: {
            userId: user.id,
            contentId,
        },
    });

    if (queueResponse.isFailure()) {
        return failure(queueResponse.error);
    }

    await queueRepo.delete(queueResponse.value.id);

    return queueResponse;
};

const next = async (
    user: User,
    contentId: string
): Promise<FailureOrSuccess<DefaultErrors, Queue>> => {
    const queueResponse = await queueRepo.findOne({
        where: {
            userId: user.id,
            contentId,
        },
    });

    if (queueResponse.isFailure()) {
        return failure(queueResponse.error);
    }

    const nextItemResponse = await queueRepo.find({
        where: {
            userId: user.id,
            position: MoreThan(queueResponse.value.position),
        },
        take: 1,
        order: { position: "asc" },
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
    contentId: string
): Promise<FailureOrSuccess<DefaultErrors, Queue>> => {
    const queueResponse = await queueRepo.findOne({
        where: {
            userId: user.id,
            contentId,
        },
    });

    if (queueResponse.isFailure()) {
        return failure(queueResponse.error);
    }

    const prevItemResponse = await queueRepo.find({
        where: {
            userId: user.id,
            position: LessThan(queueResponse.value.position),
        },
        take: 1,
        order: { position: "desc" },
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
): Promise<FailureOrSuccess<DefaultErrors, Queue | null>> => {
    if (!user.currentQueueId) {
        return success(null);
    }

    const queueResponse = await queueRepo.findById(user.currentQueueId);

    return queueResponse;
};

const list = async (
    user: User
): Promise<FailureOrSuccess<DefaultErrors, Queue[]>> => {
    const queueResponse = await queueRepo.findForUser(user.id);

    if (queueResponse.isFailure()) {
        return failure(queueResponse.error);
    }

    return queueResponse;
};

const setCurrent = async (
    user: User,
    queue: Queue
): Promise<FailureOrSuccess<DefaultErrors, User>> => {
    await pgUserRepo.update(user.id, {
        currentQueueId: queue.id,
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
