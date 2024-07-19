import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { client } from "./client";
import { AxiosError } from "axios";
import { Datadog } from "../datadog";
import { parseTicker } from "../search";

type GetCryptoTickerNewsResponse = {
    newsUrl: string;
    imageUrl: string;
    title: string;
    text: string;
    sourceName: string;
    date: string;
    topics: string[];
    sentiment: string;
    type: string;
    tickers: string[];
}[];

export const getCryptoTickerNews = async (
    tickers: string[]
): Promise<FailureOrSuccess<DefaultErrors, GetCryptoTickerNewsResponse>> => {
    try {
        const response = await client.get("", {
            params: {
                tickers: tickers.map(parseTicker).join(","), // need parseTicker for WIF (comes as "$WIF")
                items: 3,
                page: 1,
                token: "wt0c3i7seqiyfvelbfw8mguu5yci8t2h8tzuzqcd",
            },
        });

        if (response.status !== 200) {
            return failure(new Error("Failed to fetch token list"));
        }

        const data = response.data.data;

        return success(
            data.map((article: any) => ({
                newsUrl: article.news_url,
                imageUrl: article.image_url,
                title: article.title,
                text: article.text,
                sourceName: article.source_name,
                date: article.date,
                topics: article.topics,
                sentiment: article.sentiment,
                type: article.type,
                tickers: article.tickers,
            }))
        );
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";
        }

        Datadog.increment("cryptonewsapi.get_crypto_ticker_news.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};
