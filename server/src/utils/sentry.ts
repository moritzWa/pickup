import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { config } from "src/config";
import { Express } from "express";
import { hasValue } from "src/core/logic";

export const initSentry = (app?: Express) =>
    Sentry.init({
        dsn: config.sentry.dsn,
        release: process.env.RELEASE || "1.0.0",
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            app ? new Tracing.Integrations.Express({ app }) : null,
        ].filter(hasValue),
    });

export { Sentry };
