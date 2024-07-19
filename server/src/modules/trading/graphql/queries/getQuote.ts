import {
    nonNull,
    nullable,
    list,
    inputObjectType,
    queryField,
    objectType,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { QuoteService } from "../../services/quoteService";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { v4 as uuidv4 } from "uuid";
import { Datadog, Slack, SlackChannel } from "src/utils";
import BigNumber from "bignumber.js";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import {
    AccountProvider,
    TradingSide,
} from "src/core/infra/postgres/entities/types";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { magic } from "src/utils/magic";
import { quoteRepo } from "../../infra/postgres";
import { FeeService } from "src/shared/feeService/feeService";

export const QuoteAsset = inputObjectType({
    name: "QuoteAsset",
    definition: (t) => {
        t.nonNull.string("contractAddress");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
    },
});

export const GetQuoteResponse = objectType({
    name: "GetQuoteResponse",
    definition: (t) => {
        t.field("bestQuote", {
            type: nonNull("Quote"),
        });
        t.nonNull.date("timestamp");
    },
});

// Note: don't need to be logged in to get a quote. should prob rate limit
export const getQuote = queryField("getQuote", {
    type: nonNull("GetQuoteResponse"),
    args: {
        side: nonNull("TradingSideEnum"),
        // the amount is what you want to receive, not necessarily what you want to send
        amount: nonNull("Float"),
        send: nonNull("QuoteAsset"),
        receive: nonNull("QuoteAsset"),
        maxSlippageBps: nullable("Int"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const user = ctx.me;

        const { send, receive, amount, side } = args;

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[send.provider];

        if (send.contractAddress === receive.contractAddress) {
            throw new ApolloError("Cannot swap the same token", "400");
        }

        const quoteResponse = await QuoteService.getBestQuote(
            user,
            chain,
            side,
            amount,
            send,
            receive,
            args.maxSlippageBps ?? null
        );

        if (quoteResponse.isFailure()) {
            // void Slack.send({
            //     channel: SlackChannel.TradingUrgent,
            //     message: [
            //         `Error getting quote: ${quoteResponse.error.message}`,
            //         `Args: ${JSON.stringify(args, null, 2)}`,
            //     ].join("\n"),
            //     format: true,
            // });

            throwIfErrorAndDatadog(quoteResponse, {
                datadogMetric: "api.get_quote.err",
                datadogTags: {
                    type: "quote",
                },
            });
        }

        const providerQuote = quoteResponse.value;

        // ok the quote
        Datadog.increment("api.get_quote.ok", 1, {
            type: "quote",
            chain: providerQuote.bestQuote.provider,
        });

        const response: NexusGenObjects["GetQuoteResponse"] = {
            bestQuote: providerQuote.bestQuote,
            timestamp: new Date(),
        };

        return response;
    },
});
