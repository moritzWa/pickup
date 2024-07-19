import { Tags } from "hot-shots";
import { Datadog } from "./datadog";
import { Sentry } from "./sentry";

export const trackError =
    (metric: string, count: number = 1, shouldSendToSentry = true) =>
    (tags?: Tags, err?: any) => {
        err && console.error(err);

        Datadog.increment(metric, count, tags);

        if (shouldSendToSentry) {
            Sentry.captureException(err, {
                tags: {
                    datadog: metric,
                    ...(tags as any),
                },
            });
        }
    };

type TrackErrorParams = {
    metric: string;
    count?: number;
    tags?: Tags;
    err?: any;
    shouldSendToSentry?: boolean;
};

export const trackErr = ({
    metric,
    count = 1,
    tags,
    err,
    shouldSendToSentry = false,
}: TrackErrorParams) => {
    if (err) {
        console.error(err);
    }

    Datadog.increment(metric, count, tags);

    if (shouldSendToSentry) {
        Sentry.captureException(err, {
            tags: {
                datadog: metric,
                ...(tags as any),
            },
        });
    }
};

export const trackOk = (metric: string, increment: number = 1, tags?: Tags) =>
    Datadog.increment(metric, increment, tags);

export const inc = (metric: string, increment: number = 1, tags?: Tags) =>
    Datadog.increment(metric, increment, tags);

export const trackHistogram = (metric: string, value: number, tags?: Tags) =>
    Datadog.histogram(metric, value, tags);
