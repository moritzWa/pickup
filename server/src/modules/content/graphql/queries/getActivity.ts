import { enumType, idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { contentSessionRepo } from "../../infra";
import { omit } from "lodash";

export const ActivityFilter = enumType({
    name: "ActivityFilter",
    members: ["unread", "new"],
});

export const getActivity = queryField("getActivity", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        filter: nullable("ActivityFilter"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const contentSessionsResponse = await contentSessionRepo.findForUser(
            user.id,
            {
                relations: {
                    content: true,
                },
            }
        );

        throwIfError(contentSessionsResponse);

        const content = contentSessionsResponse.value.map((cs) => ({
            ...cs.content,
            session: omit(cs, ["content"]),
        }));

        return content;
    },
});
