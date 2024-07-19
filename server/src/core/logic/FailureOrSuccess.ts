import { Datadog, Slack, SlackChannel } from "src/utils";
import { Sentry } from "src/utils/sentry";
import { Maybe, UnexpectedError } from ".";
import { v4 as uuidv4 } from "uuid";

export type FailureOrSuccess<E, V> = Failure<E, never> | Success<never, V>;

export class Failure<E, V> {
    readonly _value: E;

    constructor(error: E) {
        this._value = error;
    }

    isFailure(): this is Failure<E, V> {
        return true;
    }

    isSuccess(): this is Success<E, V> {
        return false;
    }

    get value(): V {
        throw new Error(
            "Can't get the value of an error result. Use '.error' instead."
        );
    }

    get error(): E {
        return this._value;
    }
}

export class Success<E, V> {
    readonly _value: V;

    constructor(value: V) {
        this._value = value;
    }

    isFailure(): this is Failure<E, V> {
        return false;
    }

    isSuccess(): this is Success<E, V> {
        return true;
    }

    get value(): V {
        return this._value;
    }

    get error(): E {
        throw new Error(
            "Can't get the errorValue of a success result. Use '.value' instead."
        );
    }
}

export const failure = <E, V>(error: E): FailureOrSuccess<E, V> =>
    new Failure<E, never>(error);

export const success = <E, V>(value: V): FailureOrSuccess<E, V> =>
    new Success<never, V>(value);

export const failureAndLog = async <E, V>({
    error,
    message,
}: {
    error: E;
    message: string;
}): Promise<FailureOrSuccess<E, V>> => {
    // console: error
    console.error(error);

    // slack
    await Slack.send({
        channel: SlackChannel.TradingNever,
        message,
        format: true,
    });

    // failure: error
    return failure(error);
};

export const failureAndLogPruningHtml = async <E, V>({
    error,
    message,
}: {
    error: E;
    message: string;
}): Promise<FailureOrSuccess<E, V>> => {
    try {
        // console: error
        const random = uuidv4();

        console.error(random);
        console.error(error);
        console.error(message);

        const hasHtml = message.includes("<html");

        if (hasHtml) {
            // slack
            const [before, _html] = message.split("<html");

            await Slack.send({
                channel: SlackChannel.Urgent,
                message: `${before}. Pruned HTML from error message. Trace ID: ${random}`,
                format: true,
            });

            // failure: error
            return failure(error);
        }

        // slack
        await Slack.send({
            channel: SlackChannel.Urgent,
            message,
            format: true,
        });

        // failure: error
        return failure(error);
    } catch (err) {
        return failure(new UnexpectedError(err) as any);
    }
};
