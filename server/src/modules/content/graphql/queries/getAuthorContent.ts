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
import { authorRepo } from "src/modules/author/infra";

export const getAuthorContent = queryField("getAuthorContent", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        authorId: nonNull(idArg()),
        limit: nullable(intArg()),
        page: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { limit = 20, page = 0 } = args;
        const user = ctx.me!;

        const authorResponse = await authorRepo.findById(args.authorId, {
            relations: {
                contents: true,
            },
        });

        throwIfError(authorResponse);

        const content = authorResponse.value.contents.slice(
            (page || 0) * (limit || 0),
            (page || 0) * (limit || 0) + (limit || 0)
        );

        return content;
    },
});
