import {
    idArg,
    list,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Helpers, helius } from "src/utils";
import { ApolloError } from "apollo-server-errors";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BigNumber from "bignumber.js";
import { VoteService } from "../../services";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { MoreThan } from "typeorm";

export const getTokensByVotes = queryField("getTokensByVotes", {
    type: nonNull(list(nonNull("TokenData"))),
    args: {},
    resolve: async (_parent, args, ctx: Context) => {
        // get all tokens with votes
        const tokensResp = await TokenService.find({
            where: {
                numVotes: MoreThan(0),
            },
        });
        throwIfError(tokensResp);
        const tokens = tokensResp.value;

        // sort tokens by votes
        tokens.sort((a, b) => b.numVotes - a.numVotes);

        return tokens.map((token) => ({
            ...token,
            vol24h: token.vol24h === null ? null : String(token.vol24h),
        }));
    },
});
