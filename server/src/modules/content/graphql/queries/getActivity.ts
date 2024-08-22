import {
    enumType,
    idArg,
    list,
    nonNull,
    nullable,
    queryField,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentRepo, contentSessionRepo } from "../../infra";
import { keyBy, omit, uniqBy } from "lodash";
import { In } from "typeorm";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { ContentService } from "../../services/contentService";
import { User } from "src/core/infra/postgres/entities";

export const ActivityFilter = enumType({
    name: "ActivityFilter",
    members: ["unread", "new"],
});

export const getActivity = queryField("getActivity", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        username: nullable(stringArg()),
        filter: nullable("ActivityFilter"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;

        let user: User | null = null;

        if (args.username) {
            const userResponse = await pgUserRepo.findByUsername(args.username);

            throwIfError(userResponse);

            user = userResponse.value;
        } else {
            user = me;
        }

        const contentSessionsResponse = await contentSessionRepo.findForUser(
            user.id,
            {
                relations: {
                    content: true,
                },
                order: {
                    lastListenedAt: "desc",
                },
            }
        );

        throwIfError(contentSessionsResponse);

        // find the content and populate the feed
        const contentResponse = await contentRepo.find({
            where: {
                id: In(contentSessionsResponse.value.map((f) => f.contentId)),
            },
            relations: { authors: true },
        });

        throwIfError(contentResponse);

        const contentById = keyBy(contentResponse.value, (v) => v.id);

        const content = contentSessionsResponse.value.map((f) => {
            const c = contentById[f.contentId];

            return {
                ...c,
                contentSession: f,
            };
        });

        const finalContentResponse =
            await ContentService.decorateContentWithFriends(me, content);

        throwIfError(finalContentResponse);

        return finalContentResponse.value;
    },
});
