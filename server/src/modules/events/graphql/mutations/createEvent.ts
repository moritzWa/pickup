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
import { EventType } from "src/core/infra/postgres/entities/Event";
import { DateTime } from "luxon";

export const createEvent = mutationField("createEvent", {
    type: nonNull("Event"),
    args: {
        tokenId: nonNull(idArg()),
        type: nonNull("EventTypeEnum"),
        title: nonNull(stringArg()),
        link: nonNull(stringArg()),
        startTime: nonNull(dateArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);
        const user = ctx.me!;
        const { tokenId, type, title, link, startTime } = args;

        // make sure user is admin of the token
        await throwIfNotTokenAdmin(ctx, tokenId);

        // validate params
        if (title.trim() === "") throw new ApolloError("Title is required");
        if (link.trim() === "") throw new ApolloError("Link is required");
        if (
            EVENT_TYPE_GQL_TO_DOMAIN[type] === EventType.TwitterSpace &&
            !link.startsWith("https://twitter.com") &&
            !link.startsWith("https://x.com")
        ) {
            throw new ApolloError(
                "Twitter space link must be a twitter link starting with https://x.com or https://twitter.com"
            );
        }
        if (DateTime.fromJSDate(startTime).toUTC() < DateTime.utc())
            throw new ApolloError("Start time must be in the future");

        // create event
        const createResp = await EventService.create({
            tokenId,
            type: EVENT_TYPE_GQL_TO_DOMAIN[type],
            title,
            link,
            startTime,
        });
        throwIfError(createResp);
        return createResp.value;
    },
});
