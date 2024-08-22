import {
    enumType,
    idArg,
    intArg,
    list,
    nonNull,
    nullable,
    queryField,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentRepo, contentSessionRepo, feedRepo } from "../../infra";
import { In } from "typeorm";
import { keyBy } from "lodash";
import { FeedService } from "../../services/feedService";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";
import { ContentFeedFilterEnum } from "src/core/infra/postgres/entities/FeedItem";

export const ContentFeedFilter = enumType({
    name: "ContentFeedFilter",
    members: ContentFeedFilterEnum,
});

const FILTER_MAPPING: Record<
    NexusGenEnums["ContentFeedFilter"],
    ContentFeedFilterEnum
> = {
    archived: ContentFeedFilterEnum.Archived,
    for_you: ContentFeedFilterEnum.ForYou,
    friends: ContentFeedFilterEnum.Friends,
    new: ContentFeedFilterEnum.New,
    popular: ContentFeedFilterEnum.Popular,
    queue: ContentFeedFilterEnum.Queue,
    unread: ContentFeedFilterEnum.Unread,
};

export const getFeed = queryField("getFeed", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        limit: nullable(intArg()),
        page: nullable(intArg()),
        filter: nullable("ContentFeedFilter"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        console.log(args.filter);

        // console.log(args);

        const { limit = 20, page = 0 } = args;
        const user = ctx.me!;

        const feedResponse = await FeedService.getFeed(
            user,
            limit ?? 20,
            page ?? 0,
            args.filter ? FILTER_MAPPING[args.filter] : null
        );

        throwIfError(feedResponse);

        return feedResponse.value;
    },
});
