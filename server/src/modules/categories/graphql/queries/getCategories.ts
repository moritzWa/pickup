import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { ApolloError } from "apollo-server-errors";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import {
    Category,
    getCategoryForSlug,
} from "src/core/infra/postgres/entities/Token";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { sumBigNumbers } from "src/utils";
import BigNumber from "bignumber.js";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import { isNil } from "lodash";
import {
    NexusGenFieldTypes,
    NexusGenObjects,
} from "src/core/surfaces/graphql/generated/nexus";

export const getCategories = queryField("getCategories", {
    type: nonNull(list(nonNull("CategorySummary"))),
    args: {},
    resolve: async (_parent, args, ctx) => {
        const categoriesResp = await CategoryEntryService.getCategories();
        throwIfError(categoriesResp);
        const categories = categoriesResp.value;
        const resp: NexusGenFieldTypes["CategorySummary"][] = categories
            .filter((c) => c.tokens.length > 0)
            .map((c) => {
                const x = c.totalMarketCap;

                return {
                    ...c,
                    bannerImageUrl: c.bannerImageUrl ?? null,
                    iconImageUrl: c.iconImageUrl ?? null,
                    totalMarketCap:
                        c.totalMarketCap === null ||
                        c.totalMarketCap === undefined
                            ? null
                            : c.totalMarketCap.toNumber(),
                    totalVol24h:
                        c.totalVol24h === null || c.totalVol24h === undefined
                            ? null
                            : c.totalVol24h.toNumber(),
                    totalMarketCapChange:
                        c.totalMarketCapChange === null ||
                        c.totalMarketCapChange === undefined
                            ? null
                            : c.totalMarketCapChange.toNumber(),
                    totalMarketCapChangePercentage:
                        c.totalMarketCapChangePercentage === null ||
                        c.totalMarketCapChangePercentage === undefined
                            ? null
                            : c.totalMarketCapChangePercentage.toNumber(),
                    tokens: c.tokens.map((t) => ({
                        ...t,
                        marketCap: t.marketCap,
                        vol24h: t.vol24h,
                    })),
                };
            });

        // sort by number of tokens
        resp.sort((a, b) =>
            a.totalMarketCap !== null && b.totalMarketCap !== null
                ? b.totalMarketCap - a.totalMarketCap
                : b.tokens.length - a.tokens.length
        );

        return resp;
    },
});
