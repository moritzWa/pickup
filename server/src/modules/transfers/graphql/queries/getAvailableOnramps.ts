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
import { stripe } from "src/utils";
import { magic } from "src/utils/magic";
import { WalletType } from "@magic-sdk/admin";

export const GetAvailableOnrampsResponse = objectType({
    name: "GetAvailableOnrampsResponse",
    definition: (t) => {
        t.nonNull.boolean("isVenmoEnabled");
        t.nonNull.boolean("isMesoEnabled");
        t.nonNull.boolean("isCoinbasePayEnabled");
        t.nonNull.boolean("isOnramperEnabled");
        t.nonNull.boolean("isKadoEnabled");
    },
});

export const getAvailableOnramps = queryField("getAvailableOnramps", {
    type: nonNull("GetAvailableOnrampsResponse"),
    resolve: async (_parent, args, ctx: Context) => {
        const isSuperUser = ctx.me?.isSuperuser ?? false;

        return {
            isVenmoEnabled: false, // true || isSuperUser,
            isMesoEnabled: true,
            isCoinbasePayEnabled: true,
            isOnramperEnabled: true,
            isKadoEnabled: true,
        };
    },
});
