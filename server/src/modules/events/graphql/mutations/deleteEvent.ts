import { ApolloError } from "apollo-server-errors";
import {
    enumType,
    idArg,
    mutationField,
    nonNull,
    nullable,
    stringArg,
} from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    throwIfNotAdmin,
    throwIfNotAuthenticated,
    throwIfNotTokenAdmin,
} from "src/core/surfaces/graphql/context";
import { WatchlistAssetService } from "src/modules/watchlist/services/watchlistAssetService";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { EventService } from "../../services";
import { dateArg } from "src/core/surfaces/graphql/base";
import { EVENT_TYPE_GQL_TO_DOMAIN } from "../types";

export const deleteEvent = mutationField("deleteEvent", {
    type: nonNull("String"),
    args: {
        id: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);
        const user = ctx.me!;
        const { id } = args;

        // get event
        const eventResp = await EventService.findById(id);
        throwIfError(eventResp);
        const event = eventResp.value;

        // make sure user is admin of the token
        await throwIfNotTokenAdmin(ctx, event.tokenId);

        // delete event
        const deleteResp = await EventService.deleteById(id);
        throwIfError(deleteResp);

        return "OK";
    },
});
