import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
    mutationField,
    floatArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { D, Datadog, Slack, SlackChannel, helius } from "src/utils";
import {
    AccountProvider,
    CurrencyCode,
    User,
} from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import { SolanaError, solana } from "src/utils/solana";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const SubmitWithdrawalResponse = objectType({
    name: "SubmitWithdrawalResponse",
    definition(t) {
        t.nonNull.string("signature");
    },
});

export const submitWithdrawal = mutationField("submitWithdrawal", {
    type: nonNull("SubmitWithdrawalResponse"),
    args: {
        chain: nonNull("AccountProviderEnum"),
        blockHeight: nonNull(floatArg()),
        blockhash: nullable(stringArg()),
        rawTransaction: nonNull(stringArg()),
        type: nullable(stringArg()), // "crypto" | "offramp"
        orderId: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const {
            blockHeight,
            rawTransaction,
            chain: _chain,
            blockhash: _blockhash,
        } = args;

        let blockhash: string | null = _blockhash ?? null;

        if (!blockhash) {
            const blockhashResponse = await helius.blocks.current();

            throwIfError(blockhashResponse);

            blockhash = blockhashResponse.value.blockhash;
        }

        const signatureResponse = await solana.submitInitial(
            rawTransaction,
            blockhash,
            true
        );

        throwIfError(signatureResponse);

        const response = await solana.submitAndWait(
            blockHeight,
            rawTransaction
        );

        console.log(`[submit transaction successful: ${response.isSuccess()}]`);

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        if (response.isFailure()) {
            // this throws an error
            await _handleAndThrowError(user, chain, response.error);
        }

        const { durationMS, signature } = response.value;

        Datadog.increment("api.submit_withdrawal.ok", 1, { chain });

        Datadog.histogram("api.submit_withdrawal.duration", durationMS, {
            chain,
            type: "ok",
        });

        return {
            signature,
        };
    },
});

const _handleAndThrowError = async (
    user: User,
    chain: AccountProvider,
    error: SolanaError
) => {
    // if it is a timeout
    const isTimedOut = error.type === "timeout";
    const duration = error.durationMs;

    Datadog.increment("api.submit_withdrawal.err", 1, { chain });
    Datadog.histogram("api.submit_withdrawal.duration", duration, {
        chain,
        type: "err",
    });

    if (isTimedOut) {
        Datadog.increment("api.submit_withdrawal.timeout", 1, { chain });
    }

    void Slack.send({
        channel: SlackChannel.TradingUrgent,
        format: true,
        message: [
            `❌ Withdrawal failed for user ${user.email} (${user.id})`,
            `Chain: ${chain}`,
            `Error: ${error.message}`,
            `Duration: ${duration}ms`,
        ].join("\n"),
    });

    throw new ApolloError(error.message, "400");
};
