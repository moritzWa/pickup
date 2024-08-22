import { arg, idArg, nonNull, queryField } from "nexus";
import { User } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { Logger } from "src/utils";
import { contentRepo } from "../../infra";
import { ContentSessionService } from "../../services/contentSessionService";

export const getIsBookmarked = queryField("getIsBookmarked", {
    type: nonNull("Boolean"),
    args: {
        contentId: nonNull(idArg()),
        authProviderId: arg({ type: "String" }),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { contentId, authProviderId } = args;

        let user = await getUserFromContextOrAuthProviderId(
            ctx,
            authProviderId
        );

        if (!user) {
            throw new Error("User not authenticated");
        }

        const contentResponse = await contentRepo.findById(contentId);
        throwIfError(contentResponse);
        const content = contentResponse.value;

        // TODO: typically queries should not have mutations
        const sessionResponse = await ContentSessionService.findOrCreate(
            content,
            user
        );
        throwIfError(sessionResponse);

        // log if is now bookmarked or unbookmarked
        Logger.info(
            `Content ${content.title} ${
                sessionResponse.value?.isBookmarked
                    ? "bookmarked"
                    : "unbookmarked"
            } by user ${user.email}`
        );

        return sessionResponse.value?.isBookmarked ?? false;
    },
});

async function getUserFromContextOrAuthProviderId(
    ctx: Context,
    authProviderId?: string | null
): Promise<User | null> {
    if (ctx.me) {
        return ctx.me;
    }
    if (authProviderId) {
        const userResponse = await pgUserRepo.findOne({
            where: { authProviderId },
        });
        if (userResponse.isSuccess() && userResponse.value) {
            return userResponse.value;
        }
    }
    return null;
}
