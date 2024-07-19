import { ApolloError } from "apollo-server-errors";
import { list, nonNull, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";
import { ProfileService } from "../../services";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { pgRelationshipRepo } from "../../infra";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { orderBy } from "lodash";

export const getHighlightedProfiles = queryField("getHighlightedProfiles", {
    type: nonNull(list(nonNull("PublicProfileInfo"))),
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const influencersResponse = await UserService.find({
            where: {
                isInfluencer: true,
            },
        });

        throwIfError(influencersResponse);

        const influencers = influencersResponse.value;

        // for each influencer in parallel call ProfileService.getFollowersAndFollowing
        const followersPromises = influencers.map((influencer) =>
            pgRelationshipRepo.getFollowersCount(influencer.id)
        );

        const followersResponses = await Promise.all(followersPromises);

        // if there is one failure -> throw the whole thing
        const hasFailure = followersResponses.some((response) =>
            response.isFailure()
        );

        if (hasFailure) {
            throw new ApolloError(
                "Failed to fetch followers for highlighted profiles.",
                "INTERNAL_SERVER_ERROR"
            );
        }

        const highlightedProfiles = followersResponses.map(
            (response, index): NexusGenObjects["PublicProfileInfo"] => {
                console.log(response);

                const numberOfFollowers = response.value;
                const user = influencers[index];

                return {
                    id: user.id,
                    name: user.name || "",
                    avatarImageUrl: user.avatarImageUrl || "",
                    username: user.username || "",
                    numberOfFollowers,
                };
            }
        );

        const sorted = orderBy(
            highlightedProfiles,
            (profile) => profile.numberOfFollowers,
            "desc"
        );

        return sorted;
    },
});
