import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { EventService } from "../../services";
import { In } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const GetEventsForTokensResponse = objectType({
    name: "GetEventsForTokensResponse",
    definition(t) {
        t.nonNull.field("events", {
            type: nonNull(list(nonNull("Event"))),
        });
    },
});

export const getEventsForTokens = queryField("getEventsForTokens", {
    type: nonNull("GetEventsForTokensResponse"),
    args: {
        tokenIds: nonNull(list(nonNull("ID"))),
    },
    resolve: async (_parent, args, ctx) => {
        const { tokenIds } = args;

        const eventsResp = await EventService.find({
            where: {
                tokenId: In(tokenIds),
            },
        });
        throwIfError(eventsResp);
        const events = eventsResp.value;
        const sortedEvents = events.sort((a, b) => {
            return b.startTime.getTime() - a.startTime.getTime();
        });

        return {
            events: sortedEvents,
        };
    },
});
