import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { createFullUser } from "../../services/createFullUser";
import { loops } from "src/utils/loops";
import { auth } from "firebase-admin";
import { ProfileService } from "../../services/profileService";

export const CreateUserResponse = objectType({
    name: "CreateUserResponse",
    definition(t) {
        t.nonNull.field("user", { type: nonNull("User") });
        t.nonNull.string("token");
    },
});

export const createUser = mutationField("createUser", {
    type: nonNull("CreateUserResponse"),
    args: {
        name: nullable(stringArg()),
        username: nullable(stringArg()),
        email: nonNull(stringArg()),
        password: nullable(stringArg()),
        referralCode: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { authProviderId } = ctx;

        const { email, name, referralCode, username } = args;

        let fbUser: auth.UserRecord | null = null;

        if (!authProviderId) {
            if (!args.password) {
                throw new ApolloError(
                    "Password is required",
                    StatusCodes.BAD_REQUEST.toString()
                );
            }

            // if they are messaging on magic, means the email is verified? what about for non-email auth
            const firebaseUserResponse = await FirebaseProvider.createUser({
                email: email,
                password: args.password,
            });

            throwIfError(firebaseUserResponse);

            fbUser = firebaseUserResponse.value;
        } else {
            const firebaseUserResponse = await FirebaseProvider.findUserByUid(
                authProviderId
            );

            throwIfError(firebaseUserResponse);

            fbUser = firebaseUserResponse.value;
        }

        if (!fbUser) {
            throw new ApolloError(
                "Failed to make user. Contact support and we'll help you out.",
                StatusCodes.INTERNAL_SERVER_ERROR.toString()
            );
        }

        // create user in our database
        const createUserResp = await createFullUser({
            name: args.name || "",
            email: args.email,
            fbUser: fbUser,
            referredByCode: referralCode,
        });

        throwIfError(createUserResp);

        const { user, token } = createUserResp.value;

        await loops.contacts.create({
            email: user.email,
            fullName: user.name,
            userId: user.id,
        });

        await ProfileService.followFounders(user);

        return {
            token,
            user,
        };
    },
});
