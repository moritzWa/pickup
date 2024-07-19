import {
    booleanArg,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { pgUserRepo } from "../../infra/postgres";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { isNil } from "lodash";
import { magic } from "src/utils/magic";
import { ApolloError } from "apollo-server-errors";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { NotFoundError } from "src/core/logic";
import { createFullUser } from "../../services/createFullUser";
import { ProfileService } from "src/modules/profile/services";

export const LoginResponse = objectType({
    name: "LoginResponse",
    definition(t) {
        t.nonNull.string("token");
        t.nonNull.field("user", { type: nonNull("User") });
    },
});

export const login = mutationField("login", {
    type: nonNull("LoginResponse"),
    args: {
        didToken: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { didToken } = args;

        const didValidationResponse = await magic.auth.validateDid(didToken);

        throwIfError(didValidationResponse);

        const magicUserResponse = await magic.users.fromDid(didToken);

        throwIfError(magicUserResponse);

        const magicUser = magicUserResponse.value;
        const issuer = magicUser.issuer;

        if (!issuer) {
            throw new ApolloError("Invalid authorization.", "403");
        }

        if (!magicUser.email) {
            throw new ApolloError("Email not found.", "403");
        }

        const fbUserResponse = await FirebaseProvider.findUserOrCreate(
            magicUser.email
        );

        throwIfError(fbUserResponse);

        const fbUser = fbUserResponse.value;

        const decodeResponse = await magic.tokens.decode(didToken);

        throwIfError(decodeResponse);

        const [_, claim] = decodeResponse.value;

        const lastSignInTime =
            Date.parse(fbUser.metadata.lastSignInTime) / 1000;
        const tokenIssuedTime = claim.iat;

        // make sure the token was issued before the last login time of the user
        // so a replay attack cannot happen
        // https://en.wikipedia.org/wiki/Replay_attack
        if (tokenIssuedTime <= lastSignInTime) {
            throw new ApolloError("This DID token is invalid.", "403");
        }

        const userResponse = await pgUserRepo.findByIssuer(issuer);

        // if the user doesn't exist for that issuer, we need to create it
        if (userResponse.isFailure()) {
            if (userResponse.error instanceof NotFoundError) {
                const response = await createFullUser(
                    fbUser,
                    magicUser,
                    fbUser.displayName || null, // no name
                    null,
                    ProfileService.generateUsername().username
                );

                throwIfError(response);

                const { user, token } = response.value;

                return {
                    token,
                    user,
                };
            }

            throwIfError(userResponse);
        }

        const user = userResponse.value;

        const jwtResponse = await FirebaseProvider.signToken(
            user.authProviderId
        );

        throwIfError(jwtResponse);

        const token = jwtResponse.value;

        // create for firebase user if doesn't exist, login, and return back a signed token

        return {
            token,
            user,
        };
    },
});
