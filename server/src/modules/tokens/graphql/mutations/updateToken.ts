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
import {
    MemecoinLinkType,
    validateLink,
} from "src/core/infra/postgres/entities/Token";
import { TokenPermissionService } from "../../services/tokenPermissionService";
import { MEMECOIN_LINK_TYPE_GQL_TO_DOMAIN } from "../types";
import { algolia } from "src/utils/algolia";

export const MemecoinLinkInput = inputObjectType({
    name: "MemecoinLinkInput",
    definition: (t) => {
        t.field("type", {
            type: nonNull("MemecoinLinkTypeEnum"),
        });
        t.nonNull.string("url");
        t.nullable.boolean("alwaysShow");
    },
});

export const updateToken = mutationField("updateToken", {
    type: nonNull("Token"),
    args: {
        tokenId: nonNull(idArg()),
        description: nullable(stringArg()),
        bannerImageUrl: nullable(stringArg()),
        iconImageUrl: nullable(stringArg()),
        irlName: nullable(stringArg()),
        moreLinks: nullable(list(nonNull(MemecoinLinkInput))),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { tokenId } = args;
        const user = ctx.me!;

        await TokenPermissionService.throwIfNoPermission(user, tokenId);

        // original
        const tokenResponse = await tokenRepo.findById(tokenId);
        throwIfError(tokenResponse);
        const token = tokenResponse.value;

        // build moreLinks
        const moreLinks =
            args.moreLinks === undefined || args.moreLinks === null
                ? token.moreLinks
                : args.moreLinks.map((l) => ({
                      type: MEMECOIN_LINK_TYPE_GQL_TO_DOMAIN[l.type],
                      url: l.url,
                      alwaysShow: l.alwaysShow ?? false,
                  }));

        // validate moreLinks
        for (const link of moreLinks) {
            const validateResp = validateLink(link);
            throwIfError(validateResp);
        }

        // update
        const updateResponse = await tokenRepo.update(tokenId, {
            bannerUrl: args.bannerImageUrl ?? token.bannerUrl,
            iconImageUrl: args.iconImageUrl ?? token.iconImageUrl,
            description: args.description ?? token.description,
            irlName: args.irlName ?? token.irlName,
            moreLinks,
        });
        throwIfError(updateResponse);
        const val = updateResponse.value;

        // update algolia irlName
        await algolia.tokens.save([
            {
                ...val,
                objectID: val.contractAddress,
            },
        ]);

        return val;
    },
});
