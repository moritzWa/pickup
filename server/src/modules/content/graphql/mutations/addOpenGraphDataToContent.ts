import { mutationField, nonNull, stringArg } from "nexus";
import { isSuccess } from "src/core/logic";
import { Context } from "src/core/surfaces/graphql/context";
import { contentRepo } from "../../infra";
import { OpenGraphService } from "../../services/openGraphService";
import { Content } from "../types/Content";

/**
 
 Example curl command:

 curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addOpenGraphDataToContent(contentId: \"68e872a0-864c-44f6-abac-f129c36699ae\") { id title websiteUrl thumbnailImageUrl ogDescription couldntFetchThumbnail } }"
  }'

 */
export const addOpenGraphDataToContent = mutationField(
    "addOpenGraphDataToContent",
    {
        type: nonNull(Content),
        args: {
            contentId: nonNull(stringArg()),
        },
        resolve: async (_parent, args, ctx: Context, _info) => {
            // throwIfNotAuthenticated(ctx); // accessible to all users for now

            const { contentId } = args;

            // Get content by id
            const contentResponse = await contentRepo.findContentById(
                contentId
            );
            if (!isSuccess(contentResponse)) {
                throw contentResponse.error;
            }

            const content = contentResponse.value;

            // Add open graph data to content
            const openGraphData = await OpenGraphService.fetchOpenGraphData(
                content.websiteUrl
            );

            // Update content with open graph data
            content.thumbnailImageUrl = openGraphData.thumbnailImageUrl;
            content.ogDescription = openGraphData.ogDescription;
            content.couldntFetchThumbnail = openGraphData.couldntFetchThumbnail;

            // Save updated content
            const updatedContentResponse = await contentRepo.save(content);
            if (!isSuccess(updatedContentResponse)) {
                throw updatedContentResponse.error;
            }

            // Return updated content
            return updatedContentResponse.value;
        },
    }
);
