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
        didToken: nonNull(stringArg()),
        referralCode: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { didToken, name, referralCode, username } = args;

        const magicUser = {} as any;
        const email = magicUser.email;

        if (!email) throw new ApolloError("Missing email", "403");
        if (!magicUser.issuer) throw new ApolloError("Missing issuer", "400");

        // if they are messaging on magic, means the email is verified? what about for non-email auth
        const firebaseUserResponse = await FirebaseProvider.createUser({
            email: email,
            emailVerified: true,
        });
        throwIfError(firebaseUserResponse);

        // create user in our database
        const createUserResp = await createFullUser(
            firebaseUserResponse.value,
            magicUser,
            args.name || null,
            referralCode,
            username
        );
        throwIfError(createUserResp);
        const { user, token } = createUserResp.value;

        await loops.contacts.create({
            email: user.email,
            fullName: user.name,
            userId: user.id,
        });

        return {
            token,
            user,
        };
    },
});
