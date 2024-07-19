import { idArg, mutationField, nonNull, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { pgTokenPermissionRepo, pgTokenRepo } from "../../postgres";
import { TokenPermissionService } from "../../services/tokenPermissionService";

export const invitePermission = mutationField("invitePermission", {
    type: nonNull("TokenPermission"),
    args: {
        tokenId: nonNull(idArg()),
        claimCode: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { claimCode, tokenId } = args;
        const user = ctx.me!;

        await TokenPermissionService.throwIfNoPermission(user, tokenId);

        const tokenResponse = await pgTokenRepo.findById(tokenId);

        throwIfError(tokenResponse);

        const token = tokenResponse.value;

        const updatePermResponse = await pgTokenPermissionRepo.create({
            tokenId: token.id,
            claimCode: claimCode.toLowerCase(),
            userId: null,
        });

        throwIfError(updatePermResponse);

        const newPerm = updatePermResponse.value;

        return newPerm;
    },
});
