import tracer from "dd-trace";

const port = process.env.DATADOG_APM_PORT;
const hostname = process.env.DATADOG_APM_HOST;
const env = process.env.DATADOG_ENV;
const service = process.env.DATADOG_SERVICE || "pickup-server";

tracer
    .init({
        port,
        hostname,
        env,
        service: service,
        profiling: true,
        logInjection: true,
        runtimeMetrics: true,
    })
    .use("express")
    .use("http")
    .use("pg")
    .use("graphql")
    .use("ioredis")
    .use("redis");

export default tracer;
