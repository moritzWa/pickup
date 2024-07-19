import { ApolloError } from "apollo-server-errors";
import { nonNull, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";
import { ProfileService } from "../../services";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { In } from "typeorm";
import _ = require("lodash");
import { hasValue } from "src/core/logic";

export const getFollows = queryField("getFollows", {
    type: nonNull("GetFollowsResponse"),
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
            .map((obj) => ({
                ...obj,
                name: obj.name || "",
                username: obj.username || "",
            }))
            .filter(hasValue);
        const following = followingRels
            .map((f) => usersObj[f.toUserId] || null)
            .map((obj) => ({
                ...obj,
                name: obj.name || "",
                username: obj.username || "",
            }))
            .filter(hasValue);

        return {
            followers,
            following,
        };
    },
});
