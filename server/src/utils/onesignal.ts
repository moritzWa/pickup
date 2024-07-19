import {
    DefaultApi,
    createConfiguration,
    Notification,
} from "@onesignal/node-onesignal";
import axios from "axios";
import { config } from "src/config";
import { User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

// TODO: maybe use this but the error messages suck so just doing rest api
const configuration = createConfiguration({
    appKey: config.onesignal.apiKey,
});

const apiInstance = new DefaultApi(configuration);

const client = axios.create({
    baseURL: "https://onesignal.com/api/v1",
    headers: {
        Authorization: `Basic ${config.onesignal.apiKey}`,
    },
});

const sendPushNotification = async (
    user: Pick<User, "id">,
    params: { title: string; message: string }
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const notification: Notification = {
            channel_for_external_user_ids: "push",
            app_id: config.onesignal.appId,
            contents: params.message ? { en: params.message } : undefined,
            headings: params.title ? { en: params.title } : undefined,
            include_external_user_ids: [user.id],
            // ios_badge_count: user.unreadCount,
        };

        const response = await client.post("/notifications", notification);

        return success(null);
    } catch (error) {
        console.error(error);
        debugger;
        return failure(new UnexpectedError(error));
    }
};

export const onesignal = {
    notifications: { send: sendPushNotification },
};
