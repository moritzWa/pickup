import { config } from "src/config";
import { dataSource } from "src/core/infra/postgres/client";
import { AbstractLogger, LogLevel, LogMessage, QueryRunner } from "typeorm";

export class SlowQueryLogger extends AbstractLogger {
    /**
     * Write log to specific output.
     */
    protected writeLog(
        level: LogLevel,
        logMessage: LogMessage | LogMessage[],
        queryRunner?: QueryRunner
    ) {
        // console.log(logMessage);
        const messages = this.prepareLogMessages(logMessage, {
            highlightSql: false,
        });

        // console.log(messages);

        for (let message of messages) {
            switch (message.type ?? level) {
                case "log":
                case "schema-build":
                case "migration":
                    console.log(message.message);
                    break;

                case "info":
                case "query":
                    if (message.prefix) {
                        console.info(message.prefix, message.message);
                    } else {
                        console.info(message.message);
                    }
                    break;

                case "warn":
                case "query-slow":
                    const originalQuery = message.message.toString();
                    // don't explain explains
                    // don't explain rollbacks
                    if (originalQuery.includes("EXPLAIN")) break;
                    if (originalQuery.includes("ROLLBACK")) break;
                    if (originalQuery.includes("START")) break;
                    if (originalQuery.includes("BEGIN")) break;
                    if (originalQuery.includes("COMMIT")) break;

                    if (message.prefix) {
                        console.info(message.prefix, message.message);
                    } else {
                        console.info(message.message);
                    }

                    // also spit out a stacktrace and an explain plan
                    if (message.prefix == "query is slow:") {
                        Error.stackTraceLimit = 20;

                        console.trace(message.prefix, message.message);

                        if (config.typeorm.explainSlowQueries) {
                            const explainQueryRunner =
                                dataSource.createQueryRunner();
                            void explainQueryRunner?.connect().then(() => {
                                explainQueryRunner
                                    .startTransaction()
                                    .then(() => {
                                        const queryParameters =
                                            message.parameters;
                                        const query = `EXPLAIN (ANALYZE, BUFFERS, SETTINGS, WAL) ${originalQuery}`;
                                        explainQueryRunner
                                            .query(query, queryParameters)
                                            .then((result) => {
                                                console.info(
                                                    originalQuery,
                                                    result
                                                );
                                            })
                                            .catch((err) => {
                                                console.error(err);
                                            });
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                    })
                                    .finally(() => {
                                        void explainQueryRunner
                                            .rollbackTransaction()
                                            .catch((err) => {
                                                console.error(err);
                                            })
                                            .finally(() => {
                                                Error.stackTraceLimit = 10;
                                                explainQueryRunner
                                                    .release()
                                                    .catch((err) => {
                                                        console.error(err);
                                                    });
                                            });
                                    });
                            });
                        }
                    }

                    break;

                case "error":
                case "query-error":
                    if (message.prefix) {
                        console.error(message.prefix, message.message);
                    } else {
                        console.error(message.message);
                    }
                    break;
            }
        }
    }
}
