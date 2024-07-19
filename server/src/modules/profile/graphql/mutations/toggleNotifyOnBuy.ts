import {
    mutationField,
    nullable,
    objectType,
    nonNull,
    stringArg,
    idArg,
    booleanArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { ProfileService } from "../../services";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const toggleNotifyOnBuy = mutationField("toggleNotifyOnBuy", {
    type: nonNull("Relationship"),
    args: {
        fromUserId: nonNull(idArg()),
        toUserId: nonNull(idArg()),
        notifyOnBuy: nonNull(booleanArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { fromUserId, toUserId, notifyOnBuy } = args;
        throwIfNotAuthenticated(ctx);
        const user = ctx.me!;

        // toggle notify on buy
        const toggleNotifyOnBuyResp = await ProfileService.toggleNotifyOnBuy({
            toUserId,
            fromUserId,
            notifyOnBuy,
        });
        throwIfError(toggleNotifyOnBuyResp);
        const relationship = toggleNotifyOnBuyResp.value;

        return relationship;
    },
});
