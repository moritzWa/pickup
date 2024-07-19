import { MailData } from "@sendgrid/helpers/classes/mail";
import * as mailer from "@sendgrid/mail";

import { config } from "../config";

import * as SG from "@sendgrid/client";
import { uniqBy } from "lodash/fp";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";

const FROM_EMAIL = config.sendgrid.fromEmail;
const FROM_NAME = config.sendgrid.fromName;

mailer.setApiKey(config.sendgrid.secret);

SG.setApiKey(config.sendgrid.secret);

export type EmailData = { name: string; email: string };

export enum TemplateName {
    WelcomeEmail = "welcome_email",
    AddAnAccount = "add_an_account",
    ReferredByReferralEmail = "referred_by_referral_email",
    ReportDownload = "report_download",
    ClientInvite = "d-90ad2dceb35b48e6859164329c2ccb99",
}

type TemplateToId = { [templateName in TemplateName]: string };

const templateToId: TemplateToId = {
    [TemplateName.WelcomeEmail]: "d-aa6efdcba7b946919ec4ea60ee28960e",
    [TemplateName.AddAnAccount]: "d-6a91a29e6f914aa7a6657fa8cbc216e2",
    [TemplateName.ReferredByReferralEmail]:
        "d-503cbb5bb6944369a2e833c634142c17",
    [TemplateName.ReportDownload]: "d-e7f97b7e4f644440a2a198bf3907e815",
    [TemplateName.ClientInvite]: "d-90ad2dceb35b48e6859164329c2ccb99",
};

export type WelcomeEmail = {
    name: string;
};

export type AddAnAccount = {
    linkAccountUrl: string;
    firstName: string;
};

export type ReferredByReferralEmail = {
    firstName: string;
    referredUserName: string;
    claimTransactionsLink: string;
};

export type ReportDownloadEmail = {
    firstName: string;
    downloadReportUrl: string;
};

export type ClientInviteEmail = {
    clientName: string;
    applicationName: string;
    signupUrl: string;
};

export type SendGridTemplateData =
    | WelcomeEmail
    | AddAnAccount
    | ReferredByReferralEmail
    | ReportDownloadEmail
    | ClientInviteEmail;

export default class SendGrid {
    static async sendEmail({
        to,
        subject,
        from = { email: FROM_EMAIL, name: FROM_NAME },
        html,
    }: {
        to: EmailData[];
        subject: string;
        html: string;
        from?: EmailData;
    }): Promise<FailureOrSuccess<DefaultErrors, any>> {
        try {
            return success(
                await mailer.send({
                    to,
                    from,
                    subject,
                    html,
                })
            );
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    static async sendText({
        to,
        subject,
        from = { email: FROM_EMAIL, name: FROM_NAME },
        text,
    }: {
        to: EmailData[];
        subject: string;
        text: string;
        from?: EmailData;
    }): Promise<FailureOrSuccess<DefaultErrors, any>> {
        try {
            return success(
                await mailer.send({
                    to,
                    from,
                    subject,
                    text,
                })
            );
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    static async sendEmailTemplate({
        template,
        toEmails,
        ccEmails,
        bccEmails,
        dynamicTemplateData,
        subject,
        fromName,
        fromEmail,
    }: {
        template: TemplateName;
        toEmails: EmailData[];
        ccEmails?: EmailData[];
        bccEmails?: EmailData[];
        dynamicTemplateData: any;
        subject?: string;
        fromName?: string;
        fromEmail?: string;
    }): Promise<FailureOrSuccess<DefaultErrors, any>> {
        try {
            const to = uniqBy("email", toEmails);
            const setOfToEmails = new Set(toEmails?.map((c) => c.email));
            const cc = ccEmails?.filter((c) => !setOfToEmails.has(c.email));

            const msg: MailData & { dynamic_template_data: any } = {
                dynamic_template_data: dynamicTemplateData,
                subject,
                templateId: templateToId[template],
                from: {
                    email: fromEmail || FROM_EMAIL,
                    name: fromName || FROM_NAME,
                },
                to,
                cc,
                bcc: bccEmails,
            };

            const res = await mailer.send(msg as any);

            return success(res);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
