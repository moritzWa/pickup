import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
    floatArg,
    booleanArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { KadoService, OnramperService } from "../../services";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { ApolloError } from "apollo-server-errors";
import { config } from "src/config";

export const GetOfframpUrlResponse = objectType({
    name: "GetOfframpUrlResponse",
    definition: (t) => {
        t.nonNull.string("provider");
        t.nonNull.string("url");
    },
});

export const getOfframpUrl = queryField("getOfframpUrl", {
    type: nonNull("GetOfframpUrlResponse"),
    args: {
        amountUsd: nonNull(floatArg()),
        address: nonNull(stringArg()),
        chain: nonNull("AccountProviderEnum"),
        theme: nullable(stringArg()),
        isMobileWebview: nullable(booleanArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const { address, amountUsd, chain: _chain, theme } = args;

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        // use kado as the default
        const url = KadoService.getOfframpUrl(
            user,
            amountUsd,
            chain,
            address,
            theme || "light",
            args.isMobileWebview ?? null
        );

        return {
            provider: "kado",
            url: url,
        };
    },
});
