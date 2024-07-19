import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { ApolloError } from "apollo-server-errors";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { getCategoryForSlug } from "src/core/infra/postgres/entities/Token";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { sumBigNumbers } from "src/utils";
import BigNumber from "bignumber.js";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import { isNil } from "lodash";

export const getCategory = queryField("getCategory", {
    type: nonNull("DiscoveryCategory"),
    args: {
        slug: nonNull("String"),
    },
    resolve: async (_parent, args, ctx) => {
        // Note: don't require login for category so people can see it without being authed

        const categoryEnum = getCategoryForSlug(args.slug);

        if (!categoryEnum) {
            throw new ApolloError("Invalid category slug.", "404");
        }

        const tokensResponse = await CategoryEntryService.getCategoryTokens(
            categoryEnum
        );

        throwIfError(tokensResponse);

        const {
            tokens,
            bannerImageUrl,
            description,
            categoryName,
            slug,
            iconImageUrl,
            totalMarketCap,
            totalMarketCapChangePercentage,
            totalVol24h,
        } = tokensResponse.value;

        return {
            type: categoryEnum,
            tokens,
            categoryName,
            slug,
            iconImageUrl,
            description: description,
            bannerImageUrl,
            totalMarketCap: !isNil(totalMarketCap)
                ? new BigNumber(totalMarketCap)?.toNumber()
                : 0,
            totalVol24h: !isNil(totalVol24h)
                ? new BigNumber(totalVol24h)?.toNumber()
                : 0,
            totalMarketCapChange: !isNil(totalMarketCapChangePercentage)
                ? new BigNumber(totalMarketCapChangePercentage)?.toNumber()
                : 0,
        };
    },
});
