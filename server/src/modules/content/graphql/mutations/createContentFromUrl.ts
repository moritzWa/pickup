import { mutationField, nonNull, stringArg } from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { ContentFromUrlService } from "../../services/contentFromUrlService";
import { Content } from "../types/Content";

/*

Example curl command:

curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createContentFromUrl(url: \"https://blog.dennishackethal.com/posts/libertarian-faq \") { id title websiteUrl content audioUrl thumbnailImageUrl } }"            

*/

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
