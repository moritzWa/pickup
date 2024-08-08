import { FailureOrSuccess, Success } from "src/core/logic";

export const isSuccess = <E, V>(
    result: FailureOrSuccess<E, V>
): result is Success<never, V> => {
    return result.isSuccess();
};

const MAX_ERROR_LENGTH = 150;

export const getErrorMessage = (error: unknown): string => {
    const fullMessage = error instanceof Error ? error.message : String(error);
    if (fullMessage.length <= MAX_ERROR_LENGTH) {
        return fullMessage;
    }
    return fullMessage.slice(0, MAX_ERROR_LENGTH) + "...";
};
