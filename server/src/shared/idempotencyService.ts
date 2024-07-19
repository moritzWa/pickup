import { ApolloError } from "apollo-server-errors";
import { redisPersisted } from "src/utils/cache";

const ONE_DAY = 60 * 60 * 24;

const checkAndThrowIfIdempotencyConflict = async (
    idempotency: string | null
): Promise<void> => {
    if (!idempotency) {
        return;
    }

    const exists = await redisPersisted.get(`idp:${idempotency}`);

    if (exists) {
        throw new ApolloError(
            "It looks like your trade may have already been submitted. Refresh the page and if your trade didn't go through, try again.",
            "409"
        );
    }

    await redisPersisted.set(`idp:${idempotency}`, "1", "EX", ONE_DAY);

    return;
};

export const IdempotencyService = {
    checkAndThrowIfIdempotencyConflict,
};
