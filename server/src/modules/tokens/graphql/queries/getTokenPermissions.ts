import { idArg, list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { pgTokenPermissionRepo, pgTokenRepo } from "../../postgres";
import { TokenPermissionService } from "../../services/tokenPermissionService";

export const getTokenPermissions = queryField("getTokenPermissions", {
    type: nonNull(list(nonNull("TokenPermission"))),
    args: {
        tokenId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { tokenId } = args;
        const me = ctx.me!;

        await TokenPermissionService.throwIfNoPermission(me, tokenId);

        const permissionsResponse = await pgTokenPermissionRepo.find({
            where: {
                tokenId: tokenId,
            },
            relations: {
                token: true,
                user: true,
            },
        });

        throwIfError(permissionsResponse);

        const permissions = permissionsResponse.value;

        return permissions.map((p) => ({
            ...p,
            userId: p.userId,
            tokenId: p.tokenId,
            token: p.token,
            user: p.user,
        }));
    },
});
