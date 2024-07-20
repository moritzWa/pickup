import * as http from "http";
import * as express from "express";
import * as cors from "cors";

import { startApolloServer } from "../graphql";
import { Exception } from "src/core/logic";
import ApiResponse from "src/core/logic/ApiResponse";
import { config } from "src/config";
import { omit } from "lodash/fp";
import { initSentry } from "src/utils/sentry";
import * as Sentry from "@sentry/node";
import { serve } from "inngest/express";
import { cronInngestFunctions, inngestFunctions } from "src/jobs/inngest";
import { inngest, cronsInngest } from "src/jobs/inngest/clients";
import { RedisStore } from "rate-limit-redis";
import RedisClient from "ioredis";
import helmet from "helmet";

import { rateLimit } from "express-rate-limit";

const port = normalizePort(config.port);
const app = express();

app.set("trust proxy", 1);

const redisClient = new RedisClient(config.redis.cacheRedisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minutes
    max: 400, // Limit each IP to 120 requests per `window` (here, per minute)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Redis store configuration
    store: new RedisStore({
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    handler: function (req, res /*next*/) {
        return res.status(429).json({
            error: "You sent too many requests. Please wait a while then try again",
        });
    },
});

const startInngest = async () => {
    const httpServer = http.createServer(app);

    initSentry(app);

    // http routes

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json({ limit: "50mb" }));
    app.use(cors());
    app.use(helmet());

    app.get("/", (_req, res) => {
        return res.status(200).send("Welcome to movement 🏃‍♂️");
    });

    app.get("/healthz", (_req, res) => {
        // if (!dataSource || !dataSource.isInitialized) {
        //     return res.status(500).send("Not fully initialized / healthy.");
        // }

        return res.status(200).send("Healthy server 💪!");
    });

    app.use("/inngest", (req, res, next) => {
        return serve({
            client: inngest,
            functions: inngestFunctions,
            signingKey: config.inngest.signingKey,
            baseUrl: config.inngest.baseInngestUrl,
            id: "movement-workers",
        })(req, res, next);
    });

    app.use("/inngest-crons", (req, res, next) => {
        return serve({
            client: cronsInngest,
            functions: cronInngestFunctions,
            signingKey: config.inngest.signingKey,
            baseUrl: config.inngest.baseInngestUrl,
            id: "movement-crons",
        })(req, res, next);
    });

    app.use(Sentry.Handlers.errorHandler());
    app.use(exceptionHandler);

    await httpServer.listen({ port });

    console.log(`🛠  Inngest ready at http://localhost:${config.port}`);

    return httpServer;
};

const startServer = async () => {
    const httpServer = http.createServer(app);

    initSentry(app);

    // http routes

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cors());
    app.use(limiter);
    app.use(helmet());

    app.get("/", (_req, res) => {
        console.log("pid", process.pid, "handler start, blocking CPU");

        return res.status(200).send("Welcome to movement 🏃‍♂️");
    });

    app.get("/healthz", (_req, res) => {
        // if (!dataSource || !dataSource.isInitialized) {
        //     return res.status(500).send("Not fully initialized / healthy.");
        // }

        return res.status(200).send("Healthy server 💪!");
    });

    // gql server
    const gqlServer = await startApolloServer(app);

    app.use(Sentry.Handlers.errorHandler());
    // app.use(exceptionHandler);

    await httpServer.listen({ port });

    console.log(
        `🚀 Server ready at http://localhost:${config.port}${gqlServer.graphqlPath}`
    );

    return httpServer;
};

function normalizePort(val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return null;
}

async function exceptionHandler(err, req, res, next) {
    try {
        console.log(`======== API Error: ${req.method} ${req.path} ========`);

        console.log("| User");
        console.log(JSON.stringify(req.user, null, 2));

        console.log("| Route Params");
        console.log(JSON.stringify(req.params, null, 2));

        console.log("| Headers");
        console.log(
            JSON.stringify(omit(["authorization"], req.headers), null, 2)
        );

        console.log("| Query");
        console.log(JSON.stringify(req.query, null, 2));

        console.log("| Body");
        console.log(JSON.stringify(req.body, null, 2));

        if (err.stack) {
            console.log("| Stacktrace");
            console.log(err.stack);
        }

        console.log("| Error");
        console.log(err);

        if (err instanceof Exception) {
            return ApiResponse.error(err.statusCode, {
                message: err.message,
                info: { type: err.type, message: err.message },
            }).send(res);
        } else {
            console.log("======== Internal Error ========");
            if (err & err.stack) {
                console.log(err.stack);
            } else {
                console.log(err);
            }

            return ApiResponse.error(500, {
                message: "Internal error.",
            }).send(res);
        }
    } catch (e) {
        ApiResponse.error(500, { message: "Internal error." }).send(res);
        console.log("======== Internal Error ========");
        console.log(err);
        console.log(e);
    }
}

export { startServer, startInngest };
