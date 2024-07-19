import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { getTokenWarning } from "../../services/getTokenWarning";
import { Datadog } from "src/utils";

export const GetTokenOverviewResponseExtensions = objectType({
    name: "GetTokenOverviewResponseExtensions",
    definition(t) {
        t.nullable.string("coingecko");
        t.nullable.string("website");
        t.nullable.string("telegram");
        t.nullable.string("twitter");
        t.nullable.string("discord");
        t.nullable.string("medium");
        t.nullable.string("dexscreener");
    },
});
export const GetTokenInfoResponseAbout = objectType({
    name: "GetTokenInfoResponseAbout",
    definition(t) {
        t.nullable.string("description");
        t.nullable.string("bannerUrl");
        t.nonNull.string("address");
        t.nullable.int("holder");
        t.nullable.int("numMentions");
        t.nullable.string("irlName");
        t.nonNull.boolean("isClaimed");
        t.nonNull.field("links", {
            type: "GetTokenOverviewResponseExtensions",
        });
        t.nonNull.field("moreLinks", {
            type: nonNull(list(nonNull("MemecoinLink"))),
        });
        t.nonNull.field("categories", {
            type: nonNull(list(nonNull("CategoryEntry"))),
        });
    },
});

export const GetTokenInfoResponseStats = objectType({
    name: "GetTokenInfoResponseStats",
    definition(t) {
        t.nullable.float("marketCap");
        t.nullable.float("v24hUSD");
        t.nullable.float("liquidity");
        t.nullable.int("buys24h");
        t.nullable.int("sells24h");
        t.nullable.int("trades24h");
        t.nullable.int("traders24h");
        t.nullable.boolean("isLiquidityLocked");
    },
});

export const GetTokenInfoResponseSecurity = objectType({
    name: "GetTokenInfoResponseSecurity",
    definition(t) {
        t.nullable.string("creationTime");
        t.nullable.string("mintTime");
        t.nullable.boolean("freezeable");
        t.nullable.float("top10HolderPercent");
        t.nullable.float("top10UserPercent");
        t.nullable.boolean("showTop10");
    },
});

export const GetTokenInfoResponse = objectType({
    name: "GetTokenInfoResponse",
    definition(t) {
        t.nullable.string("bestLpPoolAddress");
        t.nonNull.field("about", {
            type: "GetTokenInfoResponseAbout",
        });
        t.nonNull.field("stats", {
            type: "GetTokenInfoResponseStats",
        });
        t.nonNull.field("security", {
            type: "GetTokenInfoResponseSecurity",
        });
        t.field("warning", { type: nullable("TokenWarning") });
    },
});

export const getTokenInfo = queryField("getTokenInfo", {
    type: nullable("GetTokenInfoResponse"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        contractAddress: nonNull("String"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { provider, contractAddress } = args;

        const tradingServiceResponse = TradingIntegrationService.getIntegration(
            ACCOUNT_PROVIDER_GQL_TO_DOMAIN[provider]
        );

        if (tradingServiceResponse.isFailure()) {
            Datadog.increment("api.get_token_info.err", {
                type: "get_integration",
            });

            throwIfError(tradingServiceResponse);
        }

        const tradingService = tradingServiceResponse.value;

        // get token info
        const tokenInfoResp = await tradingService.getTokenInfo(
            contractAddress
        );

        if (tokenInfoResp.isFailure()) {
            Datadog.increment("api.get_token_info.err", {
                type: "get_token_info",
            });

            throwIfError(tokenInfoResp);
        }

        const tokenInfo = tokenInfoResp.value;

        Datadog.increment("api.get_token_info.ok");

        return {
            ...tokenInfo,
            warning: tokenInfo.security.warning,
        };
    },
});
