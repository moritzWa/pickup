import { idArg, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { pgUserRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";

// TODO: fill this in more later
export const getProfile = queryField("getProfile", {
    type: nonNull("Profile"),
    args: {
        userId: nullable(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        // console.log(ctx);

        throwIfNotAuthenticated(ctx);

        const { userId } = args;
        const _user = ctx.me!;

        if (!userId) {
            throw new ApolloError("User ID is required");
        }

        const userResponse = await pgUserRepo.findById(userId);

        throwIfError(userResponse);

        const user = userResponse.value;

        return {
            id: user.id,
            username: user.username || "",
            name: user.name || "",
            description: user.description,
            numFollowers: 0,
            numFollowing: 0,
            avatarImageUrl: user.imageUrl,
            isFollowing: false,
        };
    },
});
