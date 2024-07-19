import {
    enumType,
    list,
    nonNull,
    nullable,
    objectType,
    queryField,
} from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import {
    NexusGenEnums,
    NexusGenObjects,
} from "src/core/surfaces/graphql/generated/nexus";
import { D, ZERO_BN, sumBigNumbers } from "src/utils";
import { CurrencyCode } from "src/shared/domain";
import { MagicPortfolioService } from "../../services/portfolioService/magicPortfolioService";
import { formatPercent } from "src/modules/portfolio/services/portfolioService/pricingService";
import BigNumber from "bignumber.js";
import { shouldIncludePosition } from "./utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { In } from "typeorm";
import { keyBy } from "lodash";

export const GetPositionsResponse = objectType({
    name: "GetPositionsResponse",
    definition(t) {
        t.field("positions", {
            type: nonNull(list(nonNull("PortfolioPosition"))),
        });
    },
});

export const getPositions = queryField("getPositions", {
    type: nonNull("GetPositionsResponse"),
    resolve: async (_parent, args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        // get positions
        const positionsResponse = await MagicPortfolioService.getFullPositions(
            user,
            false
        );
        throwIfError(positionsResponse);
        const allPositions = positionsResponse.value;

        // get tokens for positions
        const tokensDBResp = await TokenService.find({
            where: {
                contractAddress: In(allPositions.map((p) => p.contractAddress)),
            },
        });
        throwIfError(tokensDBResp);
        const tokensDB = tokensDBResp.value;
        const tokensDBObj = keyBy(tokensDB, (t) =>
            TokenService.buildKey(t.provider, t.contractAddress)
        );

        if (
            tokensDB.some(
                (t) =>
                    t.contractAddress ===
                    "G3j3UXrGnht1E3oXrZoVu99v8mJcZi8c6L9UVfooeQBB"
            )
        ) {
            console.log(
                "Found token with iconImageUrl: ",
                tokensDB.find(
                    (t) =>
                        t.contractAddress ===
                        "G3j3UXrGnht1E3oXrZoVu99v8mJcZi8c6L9UVfooeQBB"
                )?.iconImageUrl
            );
        }

        // merge
        const positions = allPositions
            .map((p): NexusGenObjects["PortfolioPosition"] => {
                const tokenDB =
                    tokensDBObj[
                        TokenService.buildKey(p.provider, p.contractAddress)
                    ];
                return {
                    provider: p.provider,
                    contractAddress: p.contractAddress,
                    fiatCurrency: p.fiatCurrency,
                    iconImageUrl: tokenDB?.iconImageUrl || p.iconImageUrl || "",
                    symbol: tokenDB?.symbol || p.symbol || "",
                    amount: p.amount?.toNumber() ?? 0,
                    fiatAmountCents: p.totalFiatAmountCents?.toNumber() ?? 0,
                    dailyChangePercentage: p.dailyChangePercentage?.toNumber(),
                    dailyChangePerUnitCents:
                        p.dailyChangePerUnitCents?.toNumber(),
                    dailyFiatAmountCents: p.dailyFiatAmountCents?.toNumber(),
                    dailyPercentageFormatted: p.dailyPercentageFormatted,
                    canSelectToken: p.canSelectToken,
                };
            })
            .filter(shouldIncludePosition);

        const response: NexusGenObjects["GetPositionsResponse"] = {
            positions,
        };

        return response;
    },
});
