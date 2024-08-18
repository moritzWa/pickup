import { mutationField, nonNull, stringArg } from "nexus";
import { ContentFromUrlService } from "../../services/contentFromUrlService";

export const createContentFromUrl = mutationField("createContentFromUrl", {
    type: nonNull("Content"),
    args: {
        url: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        // throwIfNotAuthenticated(ctx); // accessible to all users for now

        const { url } = args;

        const contentResponse = await ContentFromUrlService.createFromUrl(url);
        if (contentResponse.isFailure()) {
            throw contentResponse.error;
        }

        return contentResponse.value;
    },
});
