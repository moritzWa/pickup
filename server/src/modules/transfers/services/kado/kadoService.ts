import axios from "axios";
import { config } from "src/config";
import { AccountProvider, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { GetOrderApiResponse } from "./types";
import { Helpers } from "src/utils";

type KadoOrderData = {
    id: string;
    amount: number;
    depositAddress: string;
    trackingUrl: string;
    tokenContractAddress: string;
    chain: AccountProvider;
};

const getOnrampUrl = (
    user: User,
    amountUsd: number,
    chain: AccountProvider,
    address: string,
    theme: string
) => {
    const params = new URLSearchParams({
        apiKey: config.kado.apiKey,
        onPayCurrency: "USD",
        onRevCurrency: "USDC",
        onPayAmount: amountUsd.toString(),
        onToAddress: address,
        cryptoList: "USDC",
        network: chain.toLowerCase(),
        product: "BUY",
        theme,
        userRef: user.id,
        email: user.email,
        mode: "minimal",
    });

    const url = `https://app.kado.money?` + params.toString();

    return url;
};

const getOfframpUrl = (
    user: User,
    amountUsd: number,
    chain: AccountProvider,
    address: string,
    theme: string,
    isMobileWebview: boolean | null
) => {
    const params = new URLSearchParams(
        Helpers.stripUndefined({
            apiKey: config.kado.apiKey,
            offPayCurrency: "USDC",
            offRevCurrency: "USD",
            offPayAmount: amountUsd.toString(),
            offFromAddress: address,
            cryptoList: "USDC",
            network: chain.toLowerCase(),
            product: "SELL",
            theme,
            email: user.email,
            userRef: user.id,
            mode: "minimal",
            isMobileWebview: isMobileWebview === true ? true : undefined,
        }) as Record<string, string>
    );

    const url = `https://app.kado.money?` + params.toString();

    console.log(url);

    return url;
};

const getOrderId = async (
    orderId: string
): Promise<FailureOrSuccess<DefaultErrors, KadoOrderData>> => {
    try {
        const response = await axios.get<GetOrderApiResponse>(
            `https://api.kado.money/v2/public/orders/${orderId}`
        );

        return success({
            id: response.data.data.id,
            amount: response.data.data.payAmount.amount,
            depositAddress: response.data.data.depositAddress,
            trackingUrl: `https://kado.money/orders/${response.data.data.id}`,
            tokenContractAddress: response.data.data.cryptoCurrency.address,
            chain: AccountProvider.Solana,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const KadoService = {
    getOnrampUrl,
    getOfframpUrl,
    getOrderId,
};
