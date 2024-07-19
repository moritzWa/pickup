import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { EventService } from "../../services";
import { In } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { CategoryEntryService } from "src/modules/categories/services";
import { CATEGORY_GQL_TO_DOMAIN } from "src/modules/categories/graphql";

export const GetEventsForCategoryResponse = objectType({
    name: "GetEventsForCategoryResponse",
    definition(t) {
        t.nonNull.field("events", {
            type: nonNull(list(nonNull("Event"))),
        });
    },
});

export const getEventsForCategory = queryField("getEventsForCategory", {
    type: nonNull("GetEventsForCategoryResponse"),
    args: {
        category: nonNull("CategoryEnum"),
    },
    resolve: async (_parent, args, ctx) => {
        const { category } = args;

        // get tokens for category
        const tokenIdsResp = await CategoryEntryService.find({
            select: ["tokenId"],
            where: {
                category: CATEGORY_GQL_TO_DOMAIN[category],
            },
        });
        throwIfError(tokenIdsResp);
        const tokenIds = tokenIdsResp.value.map((entry) => entry.tokenId);

        // get events for tokens
        const eventsResp = await EventService.find({
            where: {
                tokenId: In(tokenIds),
            },
            order: {
                startTime: "DESC",
            },
            take: 50,
        });
        throwIfError(eventsResp);
        const events = eventsResp.value;

        return {
            events,
        };
    },
});
