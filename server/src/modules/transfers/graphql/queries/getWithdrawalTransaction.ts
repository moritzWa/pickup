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
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Slack, SlackChannel, helius } from "src/utils";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import { TradingIntegrationService } from "src/shared/integrations";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import BigNumber from "bignumber.js";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { WRAPPED_SOL_MINT } from "src/shared/integrations/providers/solana/constants";
import { canWithdraw } from "../../services";
import { failure } from "src/core/logic";

export const GetWithdrawalTransactionResponse = objectType({
    name: "GetWithdrawalTransactionResponse",
    definition: (t) => {
        t.nonNull.string("wallet");
        t.nonNull.string("txn");
        t.nullable.float("solanaLastValidBlockHeight"); // for solana
        t.nullable.string("solanaBlockhash"); // for solana
    },
});

export const getWithdrawalTransaction = queryField("getWithdrawalTransaction", {
    type: nonNull("GetWithdrawalTransactionResponse"),
    args: {
        contractAddress: nonNull("String"),
        chain: nonNull("AccountProviderEnum"),
        amount: nonNull("Float"), // ex. 54.453
        fromWalletAddress: nonNull("String"),
        toWalletAddress: nonNull("String"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { chain: _chain, contractAddress, amount } = args;

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        const tradingServiceResponse =
            TradingIntegrationService.getIntegration(chain);

        throwIfError(tradingServiceResponse);

        const tradingService = tradingServiceResponse.value;

        const userCanWithdrawResponse = await canWithdraw(
            user,
            chain,
            contractAddress,
            amount
        );

        throwIfError(userCanWithdrawResponse);

        if (
            !user.canWithdrawWithoutTokenAccount &&
            contractAddress !== WRAPPED_SOL_MINT
        ) {
            const tokenAccountResponse = await helius.wallets.hasTokenAccount({
                walletAddress: args.toWalletAddress,
                mintAddress: contractAddress,
            });

            throwIfError(tokenAccountResponse);

            const { hasTokenAccount } = tokenAccountResponse.value;

            if (!hasTokenAccount) {
                throw new ApolloError(
                    "The recipient wallet does not have a token account for the specified token. You need to set one up so they can receive this token. If you have questions just message support and we can help you.",
                    "400"
                );
            }
        }

        const withdrawalResponse =
            await tradingService.buildWithdrawTransaction({
                contractAddress,
                amount: new BigNumber(amount),
                fromWalletAddress: args.fromWalletAddress,
                toWalletAddress: args.toWalletAddress,
                isNativeToken: contractAddress === WRAPPED_SOL_MINT,
            });

        throwIfError(withdrawalResponse);

        const withdrawal = withdrawalResponse.value;

        const response: NexusGenObjects["GetWithdrawalTransactionResponse"] = {
            solanaBlockhash: withdrawal.solanaBlockhash,
            solanaLastValidBlockHeight: withdrawal.solanaLastValidBlockHeight,
            txn: withdrawal.txn,
            wallet: "awaken",
        };

        const msg: string = [
            `Withdrawal Transaction Built 🔨\n`,
            `User: ${user.email} (${user.id})`,
            `Chain: ${chain}`,
            `Contract Address: ${contractAddress}`,
            `Amount: ${amount}`,
            `From Wallet Address: ${args.fromWalletAddress}`,
            `To Wallet Address: ${args.toWalletAddress}`,
            `Blockhash: ${withdrawal.solanaBlockhash}`,
            `Block Height: ${withdrawal.solanaLastValidBlockHeight}`,
        ].join("\n");

        void Slack.send({
            channel: SlackChannel.LogsWithdrawals,
            format: true,
            message: msg,
        });

        return response;
    },
});
