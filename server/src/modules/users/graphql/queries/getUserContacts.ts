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
import { pgUserRepo } from "../../infra/postgres";

export const UserContactProfile = objectType({
    name: "UserContactProfile",
    definition: (t) => {
        t.nonNull.id("id");
        t.nullable.string("username");
        t.nullable.string("name");
        t.nullable.string("description");
        t.nullable.string("phoneNumber");
        t.nullable.string("avatarImageUrl");
    },
});

export const getUserContacts = queryField("getUserContacts", {
    type: nonNull(list(nonNull("UserContactProfile"))),
    args: {
        phoneNumbers: nonNull(list(nonNull(stringArg()))),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const phoneNumbers = args.phoneNumbers;

        // format them til

        const phoneChunks = _.chunk(phoneNumbers, 1_000);

        // get followers + following
        const userResponses = await Promise.all(
            phoneChunks.map((phones) =>
                pgUserRepo.find({
                    where: {
                        phoneNumber: In(phones),
                    },
                    select: {
                        id: true,
                        imageUrl: true,
                        username: true,
                        name: true,
                        phoneNumber: true,
                        description: true,
                    },
                })
            )
        );

        const users = userResponses
            .filter((u) => u.isSuccess())
            .map((u) => u.value)
            .flat();

        return users.map((u) => ({
            ...u,
            avatarImageUrl: u.imageUrl,
        }));
    },
});
