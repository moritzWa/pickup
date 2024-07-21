import * as StatsD from "hot-shots";
import { isNil } from "lodash";

import { config } from "src/config";
import { Slack, SlackChannel } from "./slack";

const service = process.env.DATADOG_SERVICE || "pickup-server";

// @ts-ignore
export const Datadog: StatsD.StatsD = new StatsD({
    prefix: `${service}.`,
    protocol: "udp",
    port: config.datadog.statsd.port,
    host: config.datadog.statsd.host,
    globalTags: { env: config.datadog.env },
}) as StatsD.StatsD;

export const logHistogram = ({
    metric,
    value,
    logIfOver,
    tags,
    slowMessage,
    logToConsole,
}: {
    metric: string;
    value: number;
    logIfOver?: number;
    tags?: StatsD.Tags;
    slowMessage?: string;
    logToConsole?: boolean;
}): void => {
    try {
        Datadog.histogram(metric, value, tags);

        if (logToConsole) {
            console.log(`[metric: ${metric} took ${value}]`);
        }

        if (!isNil(logIfOver) && value >= logIfOver) {
            console.log(`[slow operation detected: ${metric} is ${value}]`);
            console.log(slowMessage);
        }
    } catch (err) {
        // nothing
    }
};
