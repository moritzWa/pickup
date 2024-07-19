import { Request, Response } from "express";
import { sum, times } from "lodash";
import { fork, iterate } from "radash";
import * as crypto from "crypto";
import * as CRC32 from "crc32";
import { config, isProduction } from "src/config";
import {
    PaypalEventType,
    PaypalOrder,
    PaypalResourceStatus,
    PaypalWebhookEvent,
    paypal,
} from "src/utils/paypal";
import { Slack, SlackChannel } from "src/utils";
import { inngest, sendToInngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { depositRepo } from "../infra/postgres";
import { DepositStatus } from "src/core/infra/postgres/entities/Deposit";
import BigNumber from "bignumber.js";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import {
    EmailJobData,
    NotificationChannel,
} from "src/jobs/inngest/functions/types";
import { User } from "src/core/infra/postgres/entities";

export const handlePaypalWebhook = async (req: Request, res: Response) => {
    try {
        // const sig = req.headers["stripe-signature"];

        const webhook = req.body as PaypalWebhookEvent;

        console.log("===== paypal webhook =====");
        console.log(webhook);

        void Slack.send({
            channel: SlackChannel.Onramps,
            format: true,
            message: [
                "Received Paypal webhook",
                `Event ID: ${webhook.id}`,
                `Event Type: ${webhook.event_type}`,
                `Deposit ID: ${webhook.resource.id}`,
                `Amount: ${
                    (webhook?.resource?.purchase_units ?? [])[0]?.amount?.value
                }`,
                `Payer: ${webhook?.resource?.payer?.email_address}`,
            ].join("\n"),
        });

        const paypalCertUrl = req.headers["paypal-cert-url"] as string;
        const signature = req.headers["paypal-transmission-sig"] as string;
        const transmissionId = req.headers["paypal-transmission-id"] as string;
        const transmissionTime = req.headers[
            "paypal-transmission-time"
        ] as string;
        const authAlgo = req.headers["paypal-auth-algo"] as string;

        if (!paypalCertUrl) {
            console.log("Paypal cert not found");
            return res.status(400).send("Paypal cert not found");
        }

        if (!signature) {
            console.log("Paypal signature not found");
            return res.status(400).send("Paypal signature not found");
        }

        if (!transmissionId) {
            console.log("Paypal transmission id not found");
            return res.status(400).send("Paypal transmission id not found");
        }

        if (!transmissionTime) {
            console.log("Paypal transmission time not found");
            return res.status(400).send("Paypal transmission time not found");
        }

        if (!authAlgo) {
            console.log("Paypal auth algo not found");
            return res.status(400).send("Paypal auth algo not found");
        }

        const verifyResponse = await paypal.webhooks.verify(
            transmissionId,
            transmissionTime,
            paypalCertUrl,
            authAlgo,
            signature,
            config.paypal.webhookId,
            req.body
        );

        // sandbox doesn't have verifications
        if (isProduction() && verifyResponse.isFailure()) {
            console.error(verifyResponse.error);

            void _logErrToSlack(
                `Paypal signature verification failed`,
                webhook.resource
            );

            return res.status(400).send("Paypal signature verification failed");
        }

        console.log(`Paypal signature verified`);
        console.log(`Type of event: ${webhook.event_type}`);

        if (webhook.event_type === PaypalEventType.OrderApproved) {
            return _handleOrderApproved(res, webhook);
        }

        if (webhook.event_type === PaypalEventType.OrderCompleted) {
            return _handleOrderCompleted(res, webhook);
        }

        // Return a response to acknowledge receipt of the event
        return res.json({ received: true });
    } catch (err) {
        console.error(err);

        // to slack
        void Slack.send({
            format: true,
            message: [`Paypal webhook error: ${(err as any)?.message}`].join(
                "\n"
            ),
            channel: SlackChannel.TradingUrgent,
        });

        return res.status(500).send("Internal server error");
    }
};

const _handleOrderApproved = async (
    res: Response,
    webhook: PaypalWebhookEvent
) => {
    const amount = (webhook?.resource?.purchase_units[0] ?? [])?.amount?.value;
    const depositId = (webhook?.resource?.purchase_units[0] ?? [])
        ?.reference_id;

    console.log(`[deposit ID: ${depositId}]`);
    console.log(webhook?.resource?.purchase_units);

    if (!depositId) {
        // alert to slack
        void _logErrToSlack(`Paypal deposit ID not found`, webhook.resource);

        return res.status(400).send("Paypal deposit ID not found");
    }

    const depositResponse = await depositRepo.findById(depositId, {
        relations: { user: true },
    });

    if (depositResponse.isFailure()) {
        // alert to slack
        void _logErrToSlack(`Paypal deposit not found`, webhook.resource);

        return res.status(400).send("Paypal deposit not found");
    }

    const deposit = depositResponse.value;

    // if our deposit has completed or failed -> exit early
    if (deposit.status === DepositStatus.Completed) {
        return res.status(200).send();
    }

    if (deposit.status === DepositStatus.Failed) {
        return res.status(200).send();
    }

    const paypalOrderResponse = await paypal.orders.retrieve(
        webhook.resource.id
    );

    if (paypalOrderResponse.isFailure()) {
        console.error(paypalOrderResponse.error);

        void _logErrToSlack(
            `🚨 Paypal order retrieve failed: ${paypalOrderResponse.error.message}`,
            webhook.resource
        );

        // update to failed
        await depositRepo.update(depositId, {
            status: DepositStatus.Failed,
            paypalOrderId: webhook.resource.id,
        });

        await NotificationService.sendNotification(deposit.user, {
            title: "Deposit Failed",
            subtitle: `Deposit for $${amount} failed, does not exist. Contact support or try again.`,
            followerUserId: null,
            iconImageUrl: null,
        });

        return res.status(400).send("Paypal order retrieve failed");
    }

    const paypalOrder = paypalOrderResponse.value;

    // if it is already completed -> update and send event to onramp the funds
    // idk why but the approved event can have it be completed still. it's weird
    if (paypalOrder.status === PaypalResourceStatus.COMPLETED) {
        const updateAndSend = await _updateAndSendEvent(
            depositId,
            new BigNumber(amount),
            paypalOrder
        );

        if (updateAndSend.isFailure()) {
            console.log(updateAndSend);
            return res.status(400).send();
        }

        return res.status(200).send();
    }

    // we need to capture it
    const captureResponse = await paypal.orders.capture(webhook.resource.id);

    if (captureResponse.isFailure()) {
        console.error(captureResponse.error);

        void _logErrToSlack(
            `🚨 Paypal order capture failed: ${captureResponse.error.message}`,
            webhook.resource
        );

        // update to failed
        await depositRepo.update(depositId, {
            status: DepositStatus.Failed,
            paypalOrderId: webhook.resource.id,
        });

        await NotificationService.sendNotification(deposit.user, {
            title: "Deposit Failed",
            subtitle: `Deposit for $${amount} failed. Contact support or try again.`,
            followerUserId: null,
            iconImageUrl: null,
        });

        await _sendCaptureFailed(deposit.user);

        return res.status(400).send("Paypal order capture failed");
    }

    const order = captureResponse.value;

    // log to slack ass successfully captured
    void Slack.send({
        format: true,
        channel: SlackChannel.Onramps,
        message: [
            `✅ Paypal order capture succeeded`,
            `Deposit ID: ${webhook.resource.id}`,
            `Amount: ${amount}`,
            `Webhook ID: ${webhook.id}`,
        ].join("\n"),
    });

    const updateAndSend = await _updateAndSendEvent(
        depositId,
        new BigNumber(amount),
        order
    );

    if (updateAndSend.isFailure()) {
        console.log(updateAndSend);
        return res.status(400).send();
    }

    return res.status(200).send();
};

const _sendCaptureFailed = async (user: User) => {
    try {
        const firstName = user.name?.split(" ")[0];

        const data: EmailJobData = {
            channel: NotificationChannel.Email,
            subject: `Movement: Venmo deposit cancelled 🚫`,
            fromEmail: "team@movement.market",
            fromName: "Movement",
            html: `
            <div>
                Hello${firstName ? " " + firstName : ""},
                <br /><br />
                Your deposit from Venmo did not go through. Your Venmo account was not charged.
                <br /><br />
                You can try again, and if you have problems you can just respond to this email and we'd be happy to help.
                <br />
                <br />
                Best,
                <br />
                Movement Team
            </div>
        `,
            toEmails: [{ email: user.email, name: user.name || "" }],
        };

        await sendToInngest(
            async () =>
                await inngest.send({
                    data,
                    name: InngestEventName.SendNotification,
                })
        );

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _handleOrderCompleted = async (
    res: Response,
    webhook: PaypalWebhookEvent
) => {
    // if it is completed -> enqueue to be processed by the
    const orderCompletedEvent = webhook.resource;
    const amount = (orderCompletedEvent?.purchase_units[0] ?? [])?.amount
        ?.value;
    const depositId = (orderCompletedEvent?.purchase_units[0] ?? [])
        ?.reference_id;

    console.log(`[deposit ID: ${depositId}]`);
    console.log(webhook?.resource?.purchase_units);

    if (!depositId) {
        // alert to slack
        void _logErrToSlack(`Paypal deposit ID not found`, orderCompletedEvent);

        return res.status(400).send("Paypal deposit ID not found");
    }

    const depositResponse = await depositRepo.findById(depositId);

    if (depositResponse.isFailure()) {
        // alert to slack
        void _logErrToSlack(`Paypal deposit not found`, orderCompletedEvent);

        return res.status(400).send("Paypal deposit not found");
    }

    const deposit = depositResponse.value;

    // if already completed, just return it
    if (deposit.status === DepositStatus.Completed) {
        return res.status(200).send();
    }

    if (deposit.status === DepositStatus.Failed) {
        return res.status(200).send();
    }

    const updateAndSend = await _updateAndSendEvent(
        depositId,
        new BigNumber(amount),
        orderCompletedEvent
    );

    if (updateAndSend.isFailure()) {
        console.log(updateAndSend);
        return res.status(400).send();
    }

    return res.status(200).send();
};

const _updateAndSendEvent = async (
    depositId: string,
    amount: BigNumber,
    order: PaypalOrder
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    // update the deposit
    const depositUpdateResponse = await depositRepo.update(depositId, {
        paypalOrderId: order.id,
        status:
            order.status === PaypalResourceStatus.COMPLETED
                ? DepositStatus.Completed
                : DepositStatus.Failed,
        amount: new BigNumber(amount),
    });

    // alert if deposit update failed
    if (depositUpdateResponse.isFailure()) {
        void _logErrToSlack(
            `Paypal deposit update failed: ${depositUpdateResponse.error.message}`,
            order
        );

        return failure(new UnexpectedError("Paypal deposit update failed"));
    }

    await inngest.send({
        name: InngestEventName.OnrampDeposit,
        data: { depositId },
        id: depositId,
    });

    return success(null);
};

const _logErrToSlack = async (message: string, order: PaypalOrder) => {
    try {
        const amount = (order?.purchase_units[0] ?? [])?.amount?.value;

        void Slack.send({
            format: true,
            message: [
                message,
                `Order ID: ${order.id}`,
                `Amount: ${amount}`,
                `Status: ${order.status}`,
                `Payer: ${order?.payer?.email_address || ""}`,
            ].join("\n"),
            channel: SlackChannel.TradingUrgent,
        });
    } catch (err) {
        console.error(err);
    }
};
