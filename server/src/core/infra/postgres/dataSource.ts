import { join } from "path";
import { merge } from "lodash/fp";
import { DataSource, DataSourceOptions } from "typeorm";
import * as entities from "./entities";
import { config } from "src/config";
import { SlowQueryLogger } from "src/utils/typeormLogger";

const hasLogging = process.env.TYPEORM_LOGGING === "true";

const ENTITIES = [
    entities.User,
    entities.Notification,
    entities.Character,
    entities.Course,
    entities.Participant,
    entities.Lesson,
    entities.Message,
    entities.Lesson,
    entities.LessonProgress,
    entities.LessonSession,
];

function getMigrationDirectory() {
    const directory =
        process.env.NODE_ENV === "migration" ? "src" : `${__dirname}`;
    return `${directory}/migrations/**/*{.ts,.js}`;
}

const dataSourceConfig: DataSourceOptions = {
    type: "postgres",
    migrationsTransactionMode: "each",
    maxQueryExecutionTime: 5000, // 5 seconds
    url: config.postgres.uri,
    synchronize: false,
    installExtensions: true,
    ssl: config.postgres.ssl
        ? {
              rejectUnauthorized: true,
              ...(config.postgres.sslCaCert
                  ? { ca: [config.postgres.sslCaCert] }
                  : {}),
          }
        : undefined,
    uuidExtension: "uuid-ossp",
    applicationName: "pickup",
    entities: ENTITIES,
    migrations: [getMigrationDirectory()],
    subscribers: [join(__dirname, "**", "*.subscriber.{ts,js}")],
    extra: {
        poolSize: 10,
        connectionTimeoutMillis: 60_000, // allow 5 seconds for connection
        query_timeout: 15 * 60 * 1000, // 15 minutes max query
    },
    logging: false, // logging: ["error"],
    logger: process.env.NO_LOGGER ? undefined : new SlowQueryLogger(),

    // cache: {
    //     // FIXME: don't know if this works
    //     type: "ioredis",
    //     options: {
    //         url: config.redis.redisUrl,
    //     },
    // },
};

export const makeDataSource = (params?: Partial<DataSourceOptions>) =>
    new DataSource(merge(params, dataSourceConfig));
