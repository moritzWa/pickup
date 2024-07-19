import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { redisPersisted } from "src/utils/cache";
import {
    Helpers,
    Slack,
    SlackChannel,
    getHeliusCDNUrl,
    helius,
} from "src/utils";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { TokenMetadataCacheService } from "./tokenMetadataCacheService";
import { TokenService } from "../tokenService/tokenService";
import { keyBy } from "lodash";

export type TokenMetadata = {
    provider: AccountProvider;
    symbol: string;
    name: string;
    contractAddress: string;
    iconImageUrl: string;
};

type GetTokenMetadataParams = {
    provider: AccountProvider;
    contractAddress: string;
}[];

export const getTokenMetadatas = async (
    targets: GetTokenMetadataParams
): Promise<FailureOrSuccess<DefaultErrors, Maybe<TokenMetadata[]>>> => {
    if (targets.length === 0) return success([]);

    // try pull from cache
    const cacheResponses = await Promise.all(
        targets.map((t) =>
            TokenMetadataCacheService.fetch({
                provider: t.provider,
                contractAddress: t.contractAddress,
            })
        )
    );

    const failures = cacheResponses.filter((c) => c.isFailure());
    if (failures.length > 0) {
        void Slack.send({
            message:
                "Failed to fetch token metadata cache: " + failures[0].error,
            channel: SlackChannel.TradingNever,
        });
    }

    const fetched: TokenMetadata[] = cacheResponses
        .filter((c) => c.isSuccess() && !!c.value)
        .map((v) => v.value!.data);
    const foundByKey = keyBy(fetched, (f) =>
        TokenService.buildKey(f.provider, f.contractAddress)
    );

    // build response with helius for ones who we didn't find
    const missing = targets.filter(
        (target) =>
            !foundByKey[
                TokenService.buildKey(target.provider, target.contractAddress)
            ]
    );
    const tokenMetadataResp = await helius.tokens.metadataDAS(
        missing.map((t) => t.contractAddress)
    );
    if (tokenMetadataResp.isFailure()) return failure(tokenMetadataResp.error);
    const tokenMetadatas = tokenMetadataResp.value.map((tokenMetadata, i) => ({
        provider: missing[i].provider,
        symbol: tokenMetadata?.content?.metadata?.symbol,
        name: tokenMetadata?.content?.metadata?.name,
        contractAddress: missing[i].contractAddress,
        iconImageUrl:
            getHeliusCDNUrl(tokenMetadata) ||
            tokenMetadata?.content?.links?.image ||
            "",
    }));

    const tokenMetadatasByKey = keyBy(tokenMetadatas, (t) =>
        TokenService.buildKey(t.provider, t.contractAddress)
    );

    // try set cache
    const setCacheResponse = await Promise.all(
        tokenMetadatas.map((t) =>
            TokenMetadataCacheService.set({
                provider: t.provider,
                contractAddress: t.contractAddress,
                data: t,
            })
        )
    );
    if (setCacheResponse.some((c) => c.isFailure())) {
        void Slack.send({
            message:
                "Failed to set token metadata cache: " +
                setCacheResponse.find((c) => c.isFailure())?.error,
            channel: SlackChannel.TradingNever,
        });
    }

    return success(
        targets.map(
            (t) =>
                foundByKey[
                    TokenService.buildKey(t.provider, t.contractAddress)
                ] ||
                tokenMetadatasByKey[
                    TokenService.buildKey(t.provider, t.contractAddress)
                ] ||
                null
        )
    );
};

export const TokenMetadataService = {
    getTokenMetadatas,
};
