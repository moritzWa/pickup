import axios from "axios";
import { config } from "src/config";
import { dataSource } from "src/core/infra/postgres";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    NotFoundError,
    success,
    UnexpectedError,
} from "src/core/logic";
import { Stripe } from "stripe";
import * as qs from "qs";
import { User } from "src/core/infra/postgres/entities";
import { Helpers } from "./helpers";

const stripeClient = new Stripe(config.stripe.secretKey, {
    apiVersion: "2022-08-01",
});

const username = config.stripe.secretKey;
const password = "";

const client = axios.create({
    baseURL: "https://api.stripe.com/v1",
    auth: {
        username: username,
        password: password,
    },
});

const createCheckoutSession = async (
    params: Stripe.Checkout.SessionCreateParams
): Promise<
    FailureOrSuccess<DefaultErrors, Stripe.Response<Stripe.Checkout.Session>>
> => {
    try {
        const session = await stripeClient.checkout.sessions.create(params);

        return success(session);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const findCustomerById = async (
    id: string,
    params: Stripe.Checkout.SessionCreateParams
): Promise<
    FailureOrSuccess<DefaultErrors, Stripe.Response<Stripe.Customer>>
> => {
    try {
        const customer = await stripeClient.customers.retrieve(id, params);

        if (customer.deleted) {
            return failure(
                new NotFoundError(
                    "This customer was deleted and no longer exists."
                )
            );
        }

        return success(customer);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const createCustomer = async (
    params: Stripe.CustomerCreateParams
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>
    >
> => {
    try {
        const customer = await stripeClient.customers.create(params);

        return success(customer);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const cryptoOnRampSolana = async (
    address: string,
    user: User
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    try {
        const hasName = !!user.name;
        const parts = (user.name || "").split(" ") ?? [];

        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ");

        const data = qs.stringify(
            Helpers.stripUndefined({
                "wallet_addresses[solana]": address,
                source_currency: "usd",
                destination_network: "solana",
                destination_currency: "usdc",
                "customer_information[email]": user.email,
                "customer_information[first_name]": firstName || undefined,
                "customer_information[last_name]": lastName || undefined,
            })
        );

        const response = await client.post<{
            id: string; // has other fields but we don't care about them
            client_secret: string;
        }>("/crypto/onramp_sessions", data);

        return success(response.data.client_secret);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const stripe = {
    client: stripeClient,
    checkouts: { create: createCheckoutSession },
    customers: { retrieve: findCustomerById, create: createCustomer },
    onramp: { solana: cryptoOnRampSolana },
};
