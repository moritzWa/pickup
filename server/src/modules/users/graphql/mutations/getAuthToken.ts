import { mutationField, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getAuthToken = mutationField("getAuthToken", {
    type: nonNull("String"),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const tokenResponse = await FirebaseProvider.signToken(
            me.authProviderId
        );

        throwIfError(tokenResponse);

        return tokenResponse.value;
    },
});
