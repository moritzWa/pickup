import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { cryptonewsapi } from "src/utils/cryptonewsapi/cryptonewsapi";

export const NewsForTickers = objectType({
    name: "NewsForTickers",
    definition(t) {
        t.nonNull.string("newsUrl");
        t.nonNull.string("imageUrl");
        t.nonNull.string("title");
        t.nonNull.string("text");
        t.nonNull.string("date");
        t.nonNull.list.string("topics");
        t.nonNull.string("sentiment");
        t.nonNull.string("sourceName");
        t.nonNull.string("type");
        t.nonNull.list.string("tickers");
    },
});

export const GetNewsForTickersResponse = objectType({
    name: "GetNewsForTickersResponse",
    definition(t) {
        t.nonNull.field("news", { type: nonNull(list(NewsForTickers)) });
    },
});

export const getNewsForTickers = queryField("getNewsForTickers", {
    type: nonNull("GetNewsForTickersResponse"),
    args: {
        tickers: nonNull(list(nonNull("String"))),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { tickers } = args;

        const resp = await cryptonewsapi.getCryptoTickerNews(tickers);
        throwIfError(resp);
        return {
            news: resp.value,
        };
    },
});
