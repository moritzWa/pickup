import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";

import { config } from "../config";
import {
    NotificationChannel,
    SlackJobData,
} from "src/jobs/inngest/functions/types";
import { InngestEventName } from "src/jobs/inngest/types";
import { inngest } from "src/jobs/inngest/clients";

const token = config.slack.token;

// Initialize
const web = new WebClient(token, {
    retryConfig: { retries: 3 },
});

export enum SlackChannel {
    Airdrops = "#logs-airdrops",
    FreeMoney = "#logs-free-money",
    Onramps = "#logs-onramps",
    ReferralBonus = "#logs-referral-bonus",
    Charts = "#logs-charts",
    TradingUrgent = "#logs-trading-urgent",
    Feedback = "#logs-feedback",
    Traders = "#logs-traders",
    TradingFeedback = "#logs-trading-feedback",
    Urgent = "#logs-urgent",
    TradingNever = "#logs-trading-never",
    Swaps = "#logs-swaps",
    Referrals = "#logs-referrals",
    LogsFeeds = "#logs-feeds",
    LogsMagicStuck = "#logs-magic-stuck",
    LogsWithdrawals = "#logs-withdrawals",
}

export type SendToSlackRequest = {
    channel: string;
    message: string;
    format?: boolean;
};

export class Slack {
    static async postSlackChannel(
        options: ChatPostMessageArguments
    ): Promise<FailureOrSuccess<DefaultErrors, unknown>> {
        try {
            await web.chat.postMessage(options);

            return success(null);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    static async send({
        channel,
        message,
        format = false,
    }: SendToSlackRequest): Promise<FailureOrSuccess<DefaultErrors, null>> {
        try {
            const slackData: SlackJobData = {
                channel: NotificationChannel.Slack,
                slackChannel: channel,
                slackPost: message,
                slackPreformat: format,
            };

            const events = [
                {
                    data: slackData,
                    name: InngestEventName.SendNotification,
                } as const,
            ];

            await inngest.send(events);

            return success(null);
        } catch (err) {
            // console.log("==== slack log error ====");
            // console.log(err);
            return failure(new UnexpectedError(err));
        }
    }
}
