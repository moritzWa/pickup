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
import { loops } from "src/utils/loops";
import { auth } from "firebase-admin";

export const startSession = mutationField("startSession", {
    type: nonNull("Session"),
    args: {
        courseId: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { authProviderId } = ctx;

        return null as any;
    },
});
