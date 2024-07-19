import { config } from "src/config";
import { last } from "lodash/fp";
import { makeDataSource } from "./dataSource";
import { DataSource, DataSourceOptions, EntityManager } from "typeorm";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";

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
