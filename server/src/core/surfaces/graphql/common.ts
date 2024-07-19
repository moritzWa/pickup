import { ApolloError } from "apollo-server-errors";
import { error } from "console";
import { Tags } from "hot-shots";
import { DefaultErrors, FailureOrSuccess, getErrorCode } from "src/core/logic";
import { Datadog, Slack, SlackChannel } from "src/utils";
import { Sentry } from "src/utils/sentry";

export const throwIfError = (
    res: FailureOrSuccess<DefaultErrors, unknown>,
    message?: string,
    code?: string
) => {
    if (res.isFailure()) {
        console.log(res.error);
        // Sentry.captureException(res.error);
        throw new ApolloError(
            message || res.error.message,
            code || getErrorCode(res.error)
        );
    }
};

type ErrorOpts = {
    message?: string;
    code?: string;
    datadogMetric: string;
    datadogTags?: Tags;
    logToSlack?: boolean;
    slackMessage?: string;
};

export const throwIfErrorAndDatadog = (
    res: FailureOrSuccess<DefaultErrors, unknown>,
    opts?: ErrorOpts
) => {
    if (res.isFailure()) {
        console.log(res.error);

        if (opts?.datadogMetric) {
            console.log("[inc DD metric: " + opts?.datadogMetric + "]");
            Datadog.increment(opts.datadogMetric, {
                ...opts.datadogTags,
                // message: res.error.message,
            });
        }

        if (opts?.logToSlack) {
            void Slack.send({
                channel: SlackChannel.TradingUrgent,
                format: true,
                message: [res.error.message, opts?.slackMessage || ""].join(
                    `\n`
                ),
            });
        }

        // Sentry.captureException(res.error);
        throw new ApolloError(
            opts?.message || res.error.message,
            opts?.code || getErrorCode(res.error)
        );
    }
};
