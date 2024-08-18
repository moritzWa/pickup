import { mutationField, nonNull, stringArg } from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { ContentFromUrlService } from "../../services/contentFromUrlService";
import { Content } from "../types/Content";

export const createContentFromUrl = mutationField("createContentFromUrl", {
    type: nonNull(Content),
    args: {
        url: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context, _info) => {
        // throwIfNotAuthenticated(ctx); // accessible to all users for now

        const { url } = args;

        const contentResponse = await ContentFromUrlService.createFromUrl(url);
        if (contentResponse.isFailure()) {
            throw contentResponse.error;
        }

        return contentResponse.value;
    },
});
