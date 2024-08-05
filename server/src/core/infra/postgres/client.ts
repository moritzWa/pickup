import { last } from "lodash/fp";
import { config } from "src/config";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { DataSource, DataSourceOptions, EntityManager } from "typeorm";
import { makeDataSource } from "./dataSource";

export const postgresUrl = config.postgres.uri;

let dataSource: DataSource = makeDataSource();

export const connect = async (
    params?: Partial<DataSourceOptions>
): Promise<DataSource> => {
    // console.log(postgresUrl);
    console.log(
        `[postgres]: connecting to ${last(
            (postgresUrl || "").split("/")
        )} (ssl: ${config.postgres.ssl})`
    );

    dataSource = await makeDataSource(params).initialize();

    // Check if pgvector is installed and create it if not
    try {
        await dataSource.query("SELECT 'vector'::regtype");
        console.log("pgvector is already installed");
    } catch (error) {
        console.log("pgvector is not installed, creating extension...");
        await dataSource.query("CREATE EXTENSION IF NOT EXISTS vector");
        console.log("PG Vector extension enabled successfully.");
    }

    // Modify the curius_links table to add the embedding column if it doesn't exist
    // await dataSource.query(`
    //     DO $$
    //     BEGIN
    //         IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    //                        WHERE table_name='curius_links' AND column_name='embedding') THEN
    //             ALTER TABLE curius_links
    //             ADD COLUMN embedding VECTOR(256);
    //         END IF;
    //     END $$;
    // `);

    return dataSource;
};

export const startTransaction = async <T>(
    txnFxn: (
        dbTxn: EntityManager
    ) => Promise<FailureOrSuccess<DefaultErrors, T>>
): Promise<FailureOrSuccess<DefaultErrors, T>> => {
    try {
        return new Promise(
            async (res) =>
                await dataSource.transaction(async (dbTxn) => {
                    const result = await txnFxn(dbTxn);
                    if (result.isFailure()) return res(failure(result.error));
                    return res(success(result.value));
                })
        );
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export { dataSource };
