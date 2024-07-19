import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
    floatArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { KadoService, OnramperService } from "../../services";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { ApolloError } from "apollo-server-errors";
import { config } from "src/config";

export const GetOnrampUrlResponse = objectType({
    name: "GetOnrampUrlResponse",
    definition: (t) => {
        t.nonNull.string("provider");
        t.nonNull.string("url");
    },
});

export const getOnrampUrl = queryField("getOnrampUrl", {
    type: nonNull("GetOnrampUrlResponse"),
    args: {
        amountUsd: nonNull(floatArg()),
        address: nonNull(stringArg()),
        chain: nonNull("AccountProviderEnum"),
        overrideProvider: nullable(stringArg()),
        theme: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const {
            address,
            amountUsd,
            overrideProvider,
            chain: _chain,
            theme,
        } = args;

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        if (overrideProvider) {
            console.log(`[getting for provider ${overrideProvider}]`);

            if (overrideProvider === "kado") {
                const url = KadoService.getOnrampUrl(
                    user,
                    amountUsd,
                    chain,
                    address,
                    theme || "light"
                );

                return {
                    provider: "kado",
                    url: url,
                };
            }

            if (overrideProvider === "onramper") {
                const url = OnramperService.getOnrampUrl(
                    amountUsd,
                    chain,
                    address,
                    theme || "light"
                );

                return {
                    provider: "onramper",
                    url: url,
                };
            }

            throw new ApolloError("Invalid override provider.", "400");
        }

        console.log(
            `[getting for default provider ${config.defaultOnrampProvider}]`
        );

        if (config.defaultOnrampProvider === "onramper") {
            const url = OnramperService.getOnrampUrl(
                amountUsd,
                chain,
                address,
                theme || "light"
            );

            return {
                provider: "onramper",
                url: url,
            };
        }

        // use kado as the default
        const url = KadoService.getOnrampUrl(
            user,
            amountUsd,
            chain,
            address,
            theme || "light"
        );

        return {
            provider: "kado",
            url: url,
        };
    },
});
