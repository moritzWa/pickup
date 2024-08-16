import StatsD from "hot-shots";
import { isNil } from "lodash";

import { config } from "src/config";

const service = process.env.DATADOG_SERVICE || "pickup-server";

export const Datadog = new StatsD({
    prefix: `${service}.`,
    protocol: "udp",
    port: config.datadog.statsd.port,
    host: config.datadog.statsd.host,
    globalTags: { env: config.datadog.env },
});

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
