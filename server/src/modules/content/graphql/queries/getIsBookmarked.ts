import { arg, nonNull, queryField, stringArg } from "nexus";
import { User } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { Logger } from "src/utils";
import { contentRepo } from "../../infra";
import { ContentSessionService } from "../../services/contentSessionService";

export const getIsBookmarked = queryField("getIsBookmarked", {
    type: nonNull("Boolean"),
    args: {
        url: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { url } = args;

        Logger.info(
            `getIsBookmarked: Checking if URL ${url} is bookmarked for user ${ctx.me?.email}`
        );

        if (!url) {
            throw new Error("URL is required");
        }

        if (!ctx.me) {
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
            ctx.me
        );
        throwIfError(sessionResponse);

        Logger.info(
            `Content ${content.title} ${
                sessionResponse.value?.isBookmarked
                    ? "bookmarked"
                    : "unbookmarked"
            } by user ${ctx.me.email}`
        );

        return sessionResponse.value?.isBookmarked ?? false;
    },
});
