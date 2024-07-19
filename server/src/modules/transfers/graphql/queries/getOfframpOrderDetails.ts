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
import { throwIfError } from "src/core/surfaces/graphql/common";

export const GetOfframpOrderDetailsResponse = objectType({
    name: "GetOfframpOrderDetailsResponse",
    definition: (t) => {
        t.nonNull.string("id");
        t.nonNull.string("trackingUrl");
        t.nonNull.float("amount");
        t.nonNull.string("depositAddress");
        t.nonNull.string("tokenContractAddress");
        t.field("chain", { type: nonNull("AccountProviderEnum") });
    },
});

export const getOfframpOrderDetails = queryField("getOfframpOrderDetails", {
    type: nonNull("GetOfframpOrderDetailsResponse"),
    args: {
        provider: nonNull(stringArg()),
        orderId: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        if (args.provider === "kado") {
            const orderResponse = await KadoService.getOrderId(args.orderId);

            throwIfError(orderResponse);

            const order = orderResponse.value;

            return {
                id: order.id,
                trackingUrl: order.trackingUrl,
                amount: order.amount,
                depositAddress: order.depositAddress,
                tokenContractAddress: order.tokenContractAddress,
                chain: order.chain,
            };
        }

        throw new ApolloError(
            "Provider is not supported for fetching offramp order details."
        );
    },
});
