import { Maybe } from "src/core/logic";
import {
    EmailData,
    SendGridTemplateData,
    TemplateName,
} from "src/utils/sendgrid";

export enum NotificationChannel {
    Slack = "slack",
    Email = "email",
    Onesignal = "onesignal",
}

export type SlackJobData = {
    channel: NotificationChannel.Slack;
    refUserId?: string;
    slackPreformat?: boolean;
    slackChannel: string;
    slackPost: string;
};

export type OnesignalJobData = {
    channel: NotificationChannel.Onesignal;
    userId: string;
    title: string;
    message: string;
};

export type EmailJobData = {
    channel: NotificationChannel.Email;
    template?: TemplateName;
    data?: SendGridTemplateData;
    html?: string;
    message?: string;
    toEmails: EmailData[];
    ccEmails?: EmailData[];
    bccEmails?: EmailData[];
    subject?: string;
    fromName?: string;
    fromEmail?: string;
};

export type NotificationData = SlackJobData | EmailJobData | OnesignalJobData;

export type AnalyzeSpamAssetData = {
    providerStr: string;
    contractAddress: string;
    exampleTxnHash: string;
    assetName: string;
};
