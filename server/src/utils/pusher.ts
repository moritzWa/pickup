import * as Pusher from "pusher";
import { config } from "src/config";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { Datadog } from "./datadog";

const client = new Pusher({
    appId: config.pusher.appId,
    key: config.pusher.key,
    secret: config.pusher.secret,
    cluster: config.pusher.cluster,
    useTLS: true,
});

export enum PusherEventName {
    TransactionsInserted = "transactions.inserted",
    PortfolioRefreshed = "portfolio.refreshed",
    TradeUpdate = "trades.update",
}

const trigger = async (
    channel: string | string[],
    event: PusherEventName,
    data?: any,
    params?: Pusher.TriggerParams
): Promise<FailureOrSuccess<DefaultErrors, Pusher.Response>> => {
    try {
        // console.log(`[pusher triggering ${event} on ${channel}]`);

        const response = await client.trigger(
            channel,
            event,
            data ?? {},
            params
        );
        Datadog.increment("pusher.trigger.ok", 1, { event: event });
        return success(response);
    } catch (err) {
        console.log(err);
        Datadog.increment("pusher.trigger.err", 1);
        return failure(new UnexpectedError(err));
    }
};

const authorizeChannel = async (
    socketId: string,
    channel: string,
    data?: Pusher.PresenceChannelData
): Promise<FailureOrSuccess<DefaultErrors, Pusher.ChannelAuthResponse>> => {
    try {
        const response = await client.authorizeChannel(socketId, channel, data);
        return success(response);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const pusher = {
    trigger,
    authorizeChannel,
    client,
};
