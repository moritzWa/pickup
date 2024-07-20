import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog } from "src/utils";
import SendGrid, {
    EmailData,
    SendGridTemplateData,
    TemplateName,
} from "src/utils/sendgrid";
import { Sentry } from "src/utils/sentry";
import { Slack } from "src/utils/slack";
import { trackError } from "src/utils/trackDatadog";
import { inngest } from "../clients";
import { InngestEventName } from "../types";
import {
    EmailJobData,
    NotificationChannel,
    NotificationData,
    OnesignalJobData,
    SlackJobData,
} from "./types";
import { NonRetriableError, slugify } from "inngest";
import { config } from "src/config";
import { onesignal } from "src/utils/onesignal";

const NAME = "Send Notification";
const CONCURRENCY = 50;
const RETRIES = 3;

const sendNotification = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: CONCURRENCY,
        retries: RETRIES,
    },
    { event: InngestEventName.SendNotification },
    async ({ event, runId }) => {
        console.info(`[PROCESSING NOTIFICATION JOB ${runId}]`);
        // console.log(JSON.stringify(event.data, null, 2));

        // if (config.env === "local") {
        //     return Promise.resolve();
        // }

        const response = await _sendNotification(event.data);

        if (response.isFailure()) {
            _recordErr();
            Sentry.captureException(response.error);
            throw response.error;
        }

        _recordOk();

        return Promise.resolve();
    }
);

const _sendNotification = async (
    data: NotificationData
): Promise<FailureOrSuccess<DefaultErrors, unknown>> => {
    switch (data.channel) {
        case NotificationChannel.Slack:
            return _sendSlack(data);
        case NotificationChannel.Email:
            return _sendEmail(data);
        case NotificationChannel.Onesignal:
            return _sendOnesignal(data);
        default:
            return failure(
                new Error(
                    `Send notification for channel ${
                        (data as any).channel
                    } was not handled.`
                )
            );
    }
};

async function _sendEmail(
    data: EmailJobData
): Promise<FailureOrSuccess<DefaultErrors, unknown>> {
    if (data.template) {
        return SendGrid.sendEmailTemplate({
            toEmails: data.toEmails,
            ccEmails: data.ccEmails,
            bccEmails: data.bccEmails,
            subject: data.subject,
            template: data.template,
            dynamicTemplateData: data.data,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
        });
    }

    if (data.message) {
        return SendGrid.sendText({
            from:
                data.fromEmail && data.fromName
                    ? { email: data.fromEmail, name: data.fromName }
                    : undefined,
            to: data.toEmails,
            subject: data.subject || "",
            text: data.message,
        });
    }

    return SendGrid.sendEmail({
        from:
            data.fromEmail && data.fromName
                ? { email: data.fromEmail, name: data.fromName }
                : undefined,
        to: data.toEmails,
        subject: data.subject || "",
        html: data.html || "",
    });
}

async function _sendSlack(
    data: SlackJobData
): Promise<FailureOrSuccess<DefaultErrors, unknown>> {
    const channel = data.slackChannel;
    const post = data.slackPost;

    if (!channel) {
        return failure(new Error("No channel on notification data."));
    }

    if (!post) {
        return failure(new Error("Slack data missing post data."));
    }

    const response = await Slack.postSlackChannel({
        channel,
        text: data.slackPreformat ? "```" + post + "```" : post,
        preformat: data.slackPreformat,
    });

    if (response.isFailure()) {
        // allow slack to retry
        // return failure(new NonRetriableError("Slack failed, won't retry."));
    }

    return response;
}

async function _sendOnesignal(
    data: OnesignalJobData
): Promise<FailureOrSuccess<DefaultErrors, unknown>> {
    const user = { id: data.userId };

    const response = await onesignal.notifications.send(user, {
        title: data.title,
        message: data.message,
    });

    return response;
}

const _recordOk = (tags?: Tags) =>
    Datadog.increment("notification_worker.ok", 1, tags);

const _recordErr = trackError("notification_worker.err", 1);

export  {sendNotification};
