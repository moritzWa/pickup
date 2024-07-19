import {
    idArg,
    list,
    mutationField,
    nonNull,
    nullable,
    queryField,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { DateTime } from "luxon";
import { ApolloError } from "apollo-server-errors";
import { UserService } from "src/modules/users/services";
import { dateArg } from "src/core/surfaces/graphql/base";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Apollo } from "@sentry/tracing/types/integrations";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { Slack, SlackChannel } from "src/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { VoteService } from "../../services";

export const unvoteForToken = mutationField("unvoteForToken", {
    type: nonNull("VoteForTokenResponse"),
    args: {
        tokenId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { tokenId } = args;
        throwIfNotAuthenticated(ctx);
        const me = ctx.me!;

        // vote for token
        const unvoteForTokenResp = await VoteService.unvoteForToken(
            tokenId,
            me.id
        );
        throwIfError(unvoteForTokenResp);
        const unvoteForToken = unvoteForTokenResp.value;

        return {
            tokenId,
            numVotes: unvoteForToken.numVotes,
        };
    },
});
