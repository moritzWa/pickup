import { ApolloError } from "apollo-server-errors";
import { list, nonNull, objectType, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { In } from "typeorm";
import _ = require("lodash");
import { hasValue } from "src/core/logic";
import { ProfileService } from "../../services/profileService";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";

export const FollowersResponse = objectType({
    name: "FollowersResponse",
    definition(t) {
        t.nonNull.field("followers", {
            type: nonNull(list(nonNull("Profile"))),
        });
        t.nonNull.field("following", {
            type: nonNull(list(nonNull("Profile"))),
        });
    },
});

export const getFollows = queryField("getFollows", {
    type: nonNull("FollowersResponse"),
    args: {
        username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { username } = args;

        // get user
        const profileUserResp = await UserService.findOne({
            where: {
                username,
            },
        });
        throwIfError(profileUserResp);
        const profileUser = profileUserResp.value;

        // get followers + following
        const relationshipsResp = await ProfileService.getFollowersAndFollowing(
            profileUser.id
        );

        throwIfError(relationshipsResp);

        const { followers: followerRels, following: followingRels } =
            relationshipsResp.value;

        // fetch profile details for those users
        const usersResp = await UserService.find({
            where: [
                {
                    id: In(followerRels.map((f) => f.fromUserId)),
                },
                {
                    id: In(followingRels.map((f) => f.toUserId)),
                },
            ],
        });

        throwIfError(usersResp);

        const users = usersResp.value;
        const usersObj = _.keyBy(users, "id");

        // stitch together
        const followers = followerRels
            .map((f) => usersObj[f.fromUserId] || null)
            .map((obj): NexusGenObjects["Profile"] => ({
                ...obj,
                name: obj.name || "",
                username: obj.username || "",
                isFollowing: true,
                numFollowers: 0,
                numFollowing: 0,
            }))
            .filter(hasValue);

        const following = followingRels
            .map((f) => usersObj[f.toUserId] || null)
            .map((obj) => ({
                ...obj,
                name: obj.name || "",
                username: obj.username || "",
                isFollowing: true,
                numFollowers: 0,
                numFollowing: 0,
            }))
            .filter(hasValue);

        return {
            followers,
            following,
        };
    },
});
