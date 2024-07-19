import { startInngest, startServer } from "./surfaces/express";
import { connect } from "./infra/postgres";
import { config } from "src/config";

export const start = async (): Promise<void> => {
    await connect({ extra: { poolSize: 10 } });

    if (config.exposeInngest) {
        await startInngest();
    } else {
        await startServer();
    }
};
