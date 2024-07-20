import { mutationField, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { analytics } from "src/utils/segment";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { pgUserRepo } from "../../infra/postgres";
import { User, UserWallet } from "src/core/infra/postgres/entities/User";
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
