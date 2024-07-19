import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { SwapService } from "../../services/swapService";
import { Datadog, Slack, SlackChannel, helius } from "src/utils";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import { quoteRepo, swapRepo } from "../../infra/postgres";
import { MoreThanOrEqual } from "typeorm";
import moment = require("moment");
import {
    SOL_USDC_MINT,
    WRAPPED_SOL_MINT,
} from "src/shared/integrations/providers/solana/constants";
import { MINT_CLOSE_AUTHORITY_SIZE, MINT_SIZE } from "@solana/spl-token";
import { WRAPPED_SOL_RENT_AMOUNT } from "src/utils/solana";

export const GetSwapTransactionResponse = objectType({
    name: "GetSwapTransactionResponse",
    definition: (t) => {
        t.nonNull.string("wallet");
        t.nonNull.string("txn");
        t.nullable.float("solanaLastValidBlockHeight"); // for solana
        t.nullable.string("solanaBlockhash"); // for solana
    },
});

export const getSwapTransaction = queryField("getSwapTransaction", {
    type: nonNull("GetSwapTransactionResponse"),
    args: {
        quoteId: nonNull(idArg()),
        signerWalletAddress: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        // console.log("==== get swap transaction ====");

        throwIfNotAuthenticated(ctx);

        const start = Date.now();

        const user = ctx.me!;
        const { quoteId, signerWalletAddress } = args;

        if (!user.canTrade) {
            throw new ApolloError("You are not allowed to trade.", "400");
        }

        await throwIfTradedTooMuch(user.id);

        const quoteResponse = await quoteRepo.findById(quoteId);

        throwIfErrorAndDatadog(quoteResponse, {
            datadogMetric: "api.get_swap_transaction.err",
        });

        const quote = quoteResponse.value;
        const provider = quote.chain;

        if (
            quote.sendTokenContractAddress === WRAPPED_SOL_MINT &&
            quote.sendAmount.multipliedBy(0.99).lt(0.001)
        ) {
            throw new ApolloError("Minimum swap amount is 0.001 SOL.", "400");
        }

        if (
            quote.sendTokenContractAddress === SOL_USDC_MINT &&
            quote.sendAmount.lt(0.1)
        ) {
            throw new ApolloError("Minimum swap amount is $0.10.", "400");
        }

        // bc SOL needs to be unwrapped we basically need them to pay for the token account
        // they'll get it right back when we close the account to redeem the wrapped SOL,
        // but they need to have SOL ahead of time. otherwise if we paid for it, and then closed the account,
        // they'd be able to make 0.002 SOL from us each time. no work around atm bc we don't know the balance
        // of their token account after the trade so we cannot transfer the amount to them and then close the account and send us the rent
        // so for now we just require them to have SOL in their wallet to cover the token account (and then reclaim that + the trade amount when the account closes)
        if (
            quote.receiveTokenContractAddress === WRAPPED_SOL_MINT ||
            quote.sendTokenContractAddress === WRAPPED_SOL_MINT
        ) {
            const solBalanceResponse = await helius.wallets.getSolanaBalance(
                signerWalletAddress
            );

            if (solBalanceResponse.isFailure()) {
                Datadog.increment("api.get_swap_transaction.err", 1, {
                    type: "sol_balance",
                });

                throw new ApolloError(
                    "Failed to get your current solana balance, please try again in a second.",
                    "400"
                );
            }

            const solBalance = solBalanceResponse.value;

            if (solBalance.lte(WRAPPED_SOL_RENT_AMOUNT)) {
                throw new ApolloError(
                    `You need to have at least ${WRAPPED_SOL_RENT_AMOUNT} SOL in your wallet to sell and receive SOL. You can sell and receive USDC instead.`,
                    "400"
                );
            }
        }

        // if (
        //     quote.receiveTokenContractAddress === WRAPPED_SOL_MINT ||
        //     quote.sendTokenContractAddress === WRAPPED_SOL_MINT
        // ) {
        //     throw new ApolloError(
        //         "We are temporarily not allowing buying or selling to SOL. Please swap using USDC instead. We'll re-enable this by June 6th."
        //     );
        // }

        console.log(`[building swap for ${user.email} (${user.id})]`);

        // if (quote.estimatedSwapFiatAmountCents < 10) {
        //     throw new ApolloError("Minimum swap amount is $0.10.", "400");
        // }

        console.time("getting-swap-info");
        const swapResponse = await SwapService.getSwapInfo({
            quote,
            signerWalletAddress,
            provider,
        });
        console.timeEnd("getting-swap-info");

        throwIfErrorAndDatadog(swapResponse, {
            datadogMetric: "api.get_swap_transaction.err",
        });

        const { txn, wallet, solanaBlockhash, solanaLastValidBlockHeight } =
            swapResponse.value;

        if (!txn || !solanaBlockhash || !solanaLastValidBlockHeight) {
            void Slack.send({
                channel: SlackChannel.TradingUrgent,
                format: true,
                message: [
                    `Invalid swap transaction.`,
                    `Block height: ${solanaLastValidBlockHeight}`,
                    `Hash: ${solanaBlockhash}`,
                    `Txn: ${txn}`,
                ].join("\n"),
            });

            Datadog.increment("api.get_swap_transaction.err", 1, {
                chain: provider,
                type: "missing_info",
            });
        } else {
            Datadog.increment("api.get_swap_transaction.ok", 1, {
                chain: provider,
            });
        }

        const end = Date.now();

        console.log(`[get swap txn took ${end - start}ms]`);

        return {
            wallet,
            txn,
            solanaBlockhash,
            solanaLastValidBlockHeight,
        };
    },
});

const throwIfTradedTooMuch = async (userId: string) => {
    const numTokensTradedTodayResponse = await swapRepo.find({
        where: {
            userId,
            // where created today
            createdAt: MoreThanOrEqual(moment().subtract({ days: 1 }).toDate()),
        },
        select: {
            receiveTokenContractAddress: true,
        },
    });

    const numTokensTradedToday = new Set(
        numTokensTradedTodayResponse.value.map(
            (t) => t.receiveTokenContractAddress
        )
    );

    if (numTokensTradedToday.size > 50) {
        throw new ApolloError(
            "You have traded too much today. Please try again tomorrow.",
            "400"
        );
    }
};
