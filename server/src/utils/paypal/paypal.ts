import axios from "axios";
import { config, isProduction } from "src/config";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import {
    PaypalBearerTokenResponse,
    PaypalOrder,
    PaypalWebhookEvent,
} from "./types";
import * as qs from "qs";

const PROD_URL = "https://api-m.paypal.com";
const SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const PAYPAL_URL = isProduction() ? PROD_URL : SANDBOX_URL;

const client = axios.create({
    baseURL: PAYPAL_URL,
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json",
    },
});

// add an interceptor to get the bearer token and add as header
client.interceptors.request.use(
    async (config) => {
        try {
            const bearerTokenResponse = await _getBearerToken();

            if (bearerTokenResponse.isFailure()) {
                return Promise.reject(bearerTokenResponse.error);
            }

            if (!config.headers) config.headers = {};

            const bearerToken = bearerTokenResponse.value;

            config.headers["Authorization"] = `Bearer ${bearerToken}`;

            return config;
        } catch (error) {
            return Promise.reject(error);
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

const _getBearerToken = async (): Promise<
    FailureOrSuccess<DefaultErrors, string>
> => {
    try {
        const clientId = config.paypal.clientId;
        const secret = config.paypal.secret;

        // Note: Encode CLIENT_ID:CLIENT_SECRET in Base64 before sending it in the API call.
        const encodedCredentials = Buffer.from(
            `${clientId}:${secret}`
        ).toString("base64");

        const response = await axios.post<PaypalBearerTokenResponse>(
            `${PAYPAL_URL}/v1/oauth2/token`,
            qs.stringify({
                grant_type: "client_credentials",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${encodedCredentials}`,
                },
            }
        );

        return success(response.data.access_token);
    } catch (err) {
        console.error(err);
        return failure(new UnexpectedError(err));
    }
};

const verifyWebhookSignature = async (
    transmission_id: string,
    transmission_time: string,
    cert_url: string,
    auth_algo: string,
    transmission_sig: string,
    webhook_id: string,
    webhook_event: any
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const response = await client.post<{
            verification_status: "SUCCESS" | "FAILURE";
        }>("/v1/notifications/verify-webhook-signature", {
            transmission_id,
            transmission_time,
            cert_url,
            auth_algo,
            transmission_sig,
            webhook_id,
            webhook_event,
        });

        if (response.data.verification_status !== "SUCCESS") {
            return failure(
                new UnexpectedError("Webhook signature verification failed")
            );
        }

        return success(null);
    } catch (err) {
        console.log(err);

        return failure(new UnexpectedError(err));
    }
};

const captureOrder = async (
    orderId: string
): Promise<FailureOrSuccess<DefaultErrors, PaypalOrder>> => {
    try {
        const response = await client.post<PaypalOrder>(
            `/v2/checkout/orders/${orderId}/capture`
        );

        return success(response.data);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

const getOrderById = async (
    orderId: string
): Promise<FailureOrSuccess<DefaultErrors, PaypalOrder>> => {
    try {
        const response = await client.get<PaypalOrder>(
            `/v2/checkout/orders/${orderId}`
        );

        return success(response.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const paypal = {
    auth: { bearer: _getBearerToken },
    webhooks: { verify: verifyWebhookSignature },
    orders: { capture: captureOrder, retrieve: getOrderById },
};
