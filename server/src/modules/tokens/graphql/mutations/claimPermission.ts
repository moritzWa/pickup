import {
    booleanArg,
    idArg,
    inputObjectType,
    intArg,
    list,
    mutationField,
    nonNull,
    nullable,
    stringArg,
} from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { ApolloError } from "apollo-server-errors";
import { tokenRepo } from "src/modules/trading/infra/postgres";
import { MemecoinLinkType } from "src/core/infra/postgres/entities/Token";
import { pgTokenPermissionRepo, pgTokenRepo } from "../../postgres";
import { TokenService } from "../../services/tokenService/tokenService";

export const claimPermission = mutationField("claimPermission", {
    type: nonNull("TokenPermission"),
    args: {
        claimCode: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { claimCode } = args;
        const user = ctx.me!;

        // token permission
        const tokenPermExistsResponse = await pgTokenPermissionRepo.exists({
            where: {
                claimCode,
            },
        });
        throwIfError(tokenPermExistsResponse);
        const exists = tokenPermExistsResponse.value;
        if (!exists) throw new ApolloError("Invalid claim code.", "404");

        // get permission
        const permResponse = await pgTokenPermissionRepo.findOne({
            where: {
                claimCode,
            },
        });
        throwIfError(permResponse);
        const perm = permResponse.value;
        if (perm.userId)
            throw new ApolloError("Claim code has already been used", "403");

        // update permission
        const updatePermResponse = await pgTokenPermissionRepo.update(perm.id, {
            userId: user.id,
        });
        throwIfError(updatePermResponse);
        const newPerm = updatePermResponse.value;

        // get token
        const tokenResp = await TokenService.findOne({
            where: {
                id: newPerm.tokenId,
            },
        });
        throwIfError(tokenResp);
        const token = tokenResp.value;
        const firstTimeClaiming = token.isClaimed === false;

        // after the first claimed permission, set the claimed on the token to true
        await pgTokenRepo.update(newPerm.tokenId, {
            isClaimed: true,
        });

        // update token links
        if (firstTimeClaiming) {
            await pgTokenRepo.update(newPerm.tokenId, {
                moreLinks: TokenService.addDefaultLinks(
                    token.contractAddress,
                    token.moreLinks
                ),
            });
        }

        return newPerm;
    },
});
