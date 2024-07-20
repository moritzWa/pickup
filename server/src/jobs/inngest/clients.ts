import { EventSchemas, Inngest } from "inngest";
import { CronInngestEvents, InngestEventName, InngestEvents } from "./types";
import { config } from "src/config";
import { UnexpectedError, failure, success } from "src/core/logic";

export const buildInngestClient = () => {
    return new Inngest({
        id: "learning-workers",
        schemas: new EventSchemas().fromRecord<InngestEvents>(),
        eventKey: config.inngest.eventKey,
        baseUrl: config.inngest.baseUrl,
    });
};

export const buildCronsInngestClient = () => {
    return new Inngest({
        id: "learning-crons",
        schemas: new EventSchemas().fromRecord<CronInngestEvents>(),
        eventKey: config.inngest.eventKey,
        baseUrl: config.inngest.baseUrl,
    });
};

export const inngest = buildInngestClient();
export const cronsInngest = buildCronsInngestClient();

export const sendToInngest = async (fxn: () => Promise<any>) => {
    try {
        await fxn();
        return success(null);
    } catch (e) {
        return failure(new UnexpectedError(e));
    }
};
