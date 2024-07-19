import { list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { pgTokenPermissionRepo } from "../../postgres";

export const myTokenPermissions = queryField("myTokenPermissions", {
    type: nonNull(list(nonNull("TokenPermission"))),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;

        const permissionsResponse = await pgTokenPermissionRepo.find({
            where: {
                userId: me.id,
            },
            relations: {
                token: true,
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
