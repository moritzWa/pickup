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
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { SwapService } from "../../services/swapService";
import {
    D,
    Datadog,
    Slack,
    SlackChannel,
    helius,
    jito,
    logHistogram,
} from "src/utils";
import {
    AccountProvider,
    CurrencyCode,
    DEFAULT_SWAP_PRIVACY,
    Quote,
    Referral,
    Swap,
    ReferralCommission,
    SwapPrivacy,
    User,
} from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import {
    quoteRepo,
    swapEventRepo,
    swapFeeRepo,
    swapRepo,
} from "../../infra/postgres";
import { SolanaError, _tryToSendRaw, solana } from "src/utils/solana";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { SwapStatus, SwapType } from "src/core/infra/postgres/entities/Trading";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { v4 as uuidv4 } from "uuid";
import { AnalyticsService, EventName } from "src/shared/analyticsService";
import BigNumber from "bignumber.js";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { IdempotencyService } from "src/shared/idempotencyService";
import {
    referralCommissionRepo,
    referralRepo,
} from "src/modules/referral/infra";
import { dataSource } from "src/core/infra/postgres";
import { EntityManager } from "typeorm";

export const SubmitRawTransactionResponse = objectType({
    name: "SubmitRawTransactionResponse",
    definition(t) {
        t.nonNull.string("signature");
    },
});

export const submitRawTransaction = mutationField("submitRawTransaction", {
    type: nonNull("SubmitRawTransactionResponse"),
    args: {
        chain: nonNull("AccountProviderEnum"),
        blockhash: nonNull(stringArg()),
        rawTransaction: nonNull(stringArg()),
        idempotency: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const { rawTransaction, chain: _chain, idempotency, blockhash } = args;

        if (idempotency) {
            await IdempotencyService.checkAndThrowIfIdempotencyConflict(
                idempotency
            );
        }

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        let signature: string | null = null;

        if (chain === AccountProvider.Solana) {
            const start = Date.now();
            // fire off to jito + solana nodes
            const signatureResponse = await solana.submitInitial(
                rawTransaction,
                blockhash,
                true
            );

            const end = Date.now();

            logHistogram({
                metric: "api.submit_raw_transaction.latency",
                value: end - start,
            });

            throwIfErrorAndDatadog(signatureResponse, {
                datadogMetric: "api.submit_raw_transaction.err",
                datadogTags: { chain, type: "submit_initial" },
            });

            signature = signatureResponse.value;
        }

        if (!signature) {
            Datadog.increment("api.submit_raw_transaction.err", 1, {
                chain,
                type: "no_signature",
            });

            throw new ApolloError("Failed to get transaction.", "400");
        }

        Datadog.increment("api.submit_raw_transaction.ok", 1, { chain });

        return {
            signature,
        };
    },
});
