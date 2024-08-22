import { arg, nonNull, queryField, stringArg } from "nexus";
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
        url: nonNull(stringArg()),
        authProviderId: arg({ type: "String" }),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { url, authProviderId } = args;

        Logger.info(
            `getIsBookmarked: Checking if URL ${url} is bookmarked, authProviderId: ${authProviderId}`
        );

        if (!url) {
            throw new Error("URL is required");
        }

        let user = await getUserFromContextOrAuthProviderId(
            ctx,
            authProviderId
        );

        if (!user) {
            throw new Error("User not authenticated");
        }

        const contentResponse = await contentRepo.findOne({
            where: { websiteUrl: url },
        });
        throwIfError(contentResponse);
        const content = contentResponse.value;

        if (!content) {
            return false; // URL not saved, so it's not bookmarked
        }

        const sessionResponse = await ContentSessionService.findOrCreate(
            content,
            user
        );
        throwIfError(sessionResponse);

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
            Logger.info(
                `getUserFromContextOrAuthProviderId: Found user ${userResponse.value?.email} with authProviderId ${authProviderId}`
            );

            return userResponse.value;
        }
    }
    return null;
}
