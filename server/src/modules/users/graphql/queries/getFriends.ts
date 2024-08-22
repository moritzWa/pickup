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

export const FriendProfile = objectType({
    name: "FriendProfile",
    definition(t) {
        t.field("profile", {
            type: nonNull("Profile"),
        });
        t.nonNull.int("unreadCount");
    },
});

export const getFriends = queryField("getFriends", {
    type: nonNull(list(nonNull("FriendProfile"))),
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;

        // get followers + following
        const relationshipsResp = await ProfileService.getFollowersAndFollowing(
            me.id
        );

        throwIfError(relationshipsResp);

        const { following: followingRels } = relationshipsResp.value;

        // fetch profile details for those users
        const usersResp = await UserService.find({
            where: [
                {
                    id: In(followingRels.map((f) => f.toUserId)),
                },
            ],
        });

        throwIfError(usersResp);

        const users = usersResp.value;
        const usersObj = _.keyBy(users, (u) => u.id);

        const following = followingRels
            .map((f) => usersObj[f.toUserId] || null)
            .map((obj) => ({
                ...obj,
                name: obj.name || "",
                username: obj.username || "",
                avatarImageUrl: obj.imageUrl,
                isFollowing: true,
                numFollowers: 0,
                numFollowing: 0,
            }))
            .filter(hasValue);

        return following.map((p) => ({
            profile: p,
            unreadCount: 0,
        }));
    },
});
