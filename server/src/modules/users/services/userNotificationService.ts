import { User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { inngest } from "src/jobs/inngest/clients";
import {
    EmailJobData,
    NotificationChannel,
} from "src/jobs/inngest/functions/types";
import { InngestEventName } from "src/jobs/inngest/types";
import { onesignal } from "src/utils/onesignal";
import SendGrid, { TemplateName } from "src/utils/sendgrid";
import { twilio } from "src/utils/twilio";

const sendWelcomeEmail = async (user: User) => {
    try {
        // people don't really have names on our platform atm
        const firstName = (user.name || "").split(" ")[0] || "";

        const data: EmailJobData = {
            channel: NotificationChannel.Email,
            subject: `Pickup: thanks for signing up 📈`,
            fromEmail: "team@pickup.market",
            fromName: "Pickup",
            html: `
                <div>
                    Hello${firstName ? " " + firstName : ""},
                    <br /><br />
                    Thank you for signing up for the new Pickup app!
                    <br /><br />
                    If we can do anything to make your experience using the app better, respond to this email and we'll be right on it 🫡.
                    <br />
                    <br />
                    Best,
                    <br />
                    Pickup Team
                </div>
            `,
            toEmails: [{ email: user.email, name: user.name || "" }],
        };

        await inngest.send({
            data,
            name: InngestEventName.SendNotification,
        });

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const sendFeedbackToTraderEmail = async (user: User) => {
    try {
        // people don't really have names on our platform atm
        const firstName = (user.name || "").split(" ")[0] || "";

        const data: EmailJobData = {
            channel: NotificationChannel.Email,
            subject: `Pickup: we'd love to hear about your experience 🙏`,
            fromEmail: "team@pickup.market",
            fromName: "Pickup",
            html: `
                <div>
                    Hello${firstName ? " " + firstName : ""},
                    <br /><br />
                    Thank you for trying out and trading on the new Pickup trading app!
                    <br /><br />
                    Quick question: what was your favorite and least favorite part of the app so far? 
                    <br /><br />
                    Best,
                    <br />
                    Pickup Team
                    <br />
                    <br />
                    P.S. If you want to earn a $20 Amazon gift card for a 30-minute Zoom call, respond to this email letting us know!
                </div>
            `,
            toEmails: [{ email: user.email, name: user.name || "" }],
        };

        await inngest.send({
            data,
            name: InngestEventName.SendNotification,
        });

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const sendFeedbackToNonTraderEmail = async (user: User) => {
    try {
        // people don't really have names on our platform atm
        const firstName = (user.name || "").split(" ")[0] || "";

        const data: EmailJobData = {
            channel: NotificationChannel.Email,
            subject: `Pickup: we'd love to hear about your experience 🙏`,
            fromEmail: "team@pickup.market",
            fromName: "Pickup",
            html: `
                <div>
                    Hello${firstName ? " " + firstName : ""},
                    <br /><br />
                    Thank you for downloading Pickup!
                    <br /><br />
                    I wanted to reach out to see if you need any help getting started? What would make Pickup a no-brainer place for you to listen to podcasts?
                    <br /><br />
                    Best,
                    <br />
                    Pickup Team
                    <br />
                    <br />
                    P.S. If you want to earn a $20 Amazon gift card for a 30-minute Zoom call, respond to this email letting us know!
                </div>
            `,
            toEmails: [{ email: user.email, name: user.name || "" }],
        };

        await inngest.send({
            data,
            name: InngestEventName.SendNotification,
        });

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const UserNotificationService = {
    sendWelcomeEmail,
    sendFeedbackToTraderEmail,
    sendFeedbackToNonTraderEmail,
};
