import axios from "axios";
import {
    AccountProvider,
    CurrencyCode,
} from "src/core/infra/postgres/entities";
import {
    FailureOrSuccess,
    DefaultErrors,
    success,
    failure,
    UnexpectedError,
    Maybe,
} from "src/core/logic";
import {
    NexusGenEnums,
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { DiscoveryResultType } from "src/modules/discovery/graphql";
import * as Fuse from "fuse.js";
import { Dictionary, isNil, keyBy, uniq } from "lodash";
import { DiscoveryJupiterTokensCacheService } from "../../discoveryJupiterTokensCache";
import { repairTicker, parseTicker } from "src/utils/search";
import BigNumber from "bignumber.js";
import * as numbro from "numbro";
import {
    D,
    HeliusTokenDASMetadata,
    coingecko,
    getHeliusCDNUrl,
    helius,
    logHistogram,
    wrapAxiosWithRetry,
} from "src/utils";
import { formatPrice } from "./utils";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { algolia } from "src/utils/algolia";
import { SearchOptions } from "@algolia/client-search";
import { IsNull, Not } from "typeorm";
import { BlacklistReason } from "src/core/infra/postgres/entities/Token";

const client = axios.create({
    baseURL: "https://token.jup.ag",
    timeout: 30_000,
});

type JupiterToken = {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI: string | null;
    tags?: string[];
    extensions?: {
        coingeckoId: string;
    };
};

wrapAxiosWithRetry(client, {
    // this way if we have to retry, the timeout resets to the above 15 seconds
    // we want this behavior
    shouldResetTimeout: true,
    retries: 3,
});

const IMAGE_OVERRIDES: Record<string, string> = {
    EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm:
        "https://assets.movement.market/coins/wif.jpeg",
};

export const _getTokens = async (
    url: string
): Promise<FailureOrSuccess<DefaultErrors, JupiterToken[]>> => {
    try {
        const response = await client.get<JupiterToken[]>(url);

        return success(response.data);
    } catch (error) {
        console.error(error);
        return failure(new UnexpectedError(error));
    }
};

export type JupTokenWithStrictTag = {
    coinGeckoTokenId?: string | null;
    contractAddress: string;
    iconImageUrl?: string | null;
    name: string;
    price?: number | null;
    priceChangePercentage24h?: number | null;
    priceChangePercentage24hFormatted?: string | null;
    priceFormatted?: string | null;
    provider: NexusGenEnums["AccountProviderEnum"];
    symbol: string;
    type: NexusGenEnums["DiscoveryResultTypeEnum"];
    isStrict: boolean;
    index: number;
};

export const fetchJupiterTokensWithoutCache = async (): Promise<
    FailureOrSuccess<DefaultErrors, JupTokenWithStrictTag[]>
> => {
    const [strictResponse, allResponse] = await Promise.all([
        _getTokens("/strict"),
        _getTokens("/all"),
    ]);

    if (strictResponse.isFailure()) {
        return failure(strictResponse.error);
    }

    if (allResponse.isFailure()) {
        return failure(allResponse.error);
    }

    // merge responses, remove duplicates by contract address, add isStrict for sorting
    const strictSeenContractAddresses = new Set<string>(
        strictResponse.value.map((t) => t.address)
    );
    const tokens = [
        ...strictResponse.value.map((t) => ({
            ...t,
            isStrict: true,
            parsedSymbol: parseTicker(t.symbol),
        })),
        ...allResponse.value
            .filter((t) => !strictSeenContractAddresses.has(t.address))
            .map((t) => ({
                ...t,
                isStrict: false,
                parsedSymbol: parseTicker(t.symbol),
            })),
    ].map((t, i) => ({
        coinGeckoTokenId: t?.extensions?.coingeckoId || null,
        name: t.name,
        symbol: t.symbol,
        iconImageUrl: IMAGE_OVERRIDES[t.address] || t.logoURI || "",
        contractAddress: t.address,
        provider: AccountProvider.Solana,
        price: null,
        priceFormatted: null,
        type: DiscoveryResultType.FungibleToken,
        isStrict: t.isStrict,
        index: i,
    }));

    return success(tokens);
};

export const getJupiterTokens = async ({
    search: _search,
    contractAddresses,
}: {
    search?: Maybe<string>;
    contractAddresses?: Maybe<
        {
            contractAddress: string;
        }[]
    >;
}): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenRootTypes["GetDiscoveryResultsResponse"]["results"]
    >
> => {
    const start = Date.now();
    const search = _search ? parseTicker(_search) : null;

    // get blacklisted tokens
    const blacklistResp = await TokenService.getBlacklist();
    if (blacklistResp.isFailure()) return failure(blacklistResp.error);
    const blacklistObj = blacklistResp.value;

    // if has contract addresses
    if (contractAddresses && contractAddresses.length > 0) {
        return _handleSearchForContractAddresses(
            blacklistObj,
            contractAddresses
        );
    }

    if (search) {
        return _handleSearchByString(search, blacklistObj);
    }

    // don't return back a massive list, in the future maybe return back some paginated amount of tokens
    return success([]);
};

const _handleSearchByString = async (
    search: string | null,
    blacklistObj: Dictionary<Maybe<BlacklistReason>>
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenRootTypes["GetDiscoveryResultsResponse"]["results"]
    >
> => {
    if (!search) {
        return success([]);
    }

    const ticker = repairTicker(search);

    // between 2 and 6 characters long
    const isPossiblySymbol = ticker.length >= 2 && ticker.length <= 4;

    console.time("algolia-search");
    const restrictToSymbol: SearchOptions = isPossiblySymbol
        ? {
              relevancyStrictness: 90,
              typoTolerance: "strict",
              restrictSearchableAttributes: isPossiblySymbol
                  ? ["symbol"]
                  : undefined,
          }
        : {};

    const tokensResponse = await algolia.tokens.search(
        ticker ?? "",
        {} // FAILS FOR IGGY AND EVERYONE BUYS $30M VOLUME COIN !!!
    );

    console.timeEnd("algolia-search");

    if (tokensResponse.isFailure()) {
        return failure(tokensResponse.error);
    }

    const contracts = tokensResponse.value.hits.map((t) => t.contractAddress);

    // lookup in helius
    const tokenMetadataResponse = await helius.tokens.metadataDAS(contracts);

    const tokenMetadataMapping = tokenMetadataResponse.isSuccess()
        ? keyBy(
              tokenMetadataResponse.value,
              (v: HeliusTokenDASMetadata) => v.id
          )
        : {};

    const isAllowedToken = (t: NexusGenRootTypes["DiscoveryResult"]) =>
        // filter blacklist
        !blacklistObj[
            TokenService.buildKey(
                t.provider as AccountProvider,
                t.contractAddress
            )
        ];

    const tokens = tokensResponse.value.hits
        .map((token): NexusGenRootTypes["DiscoveryResult"] => {
            const metadata = tokenMetadataMapping[token.contractAddress];
            const imageUrl = getHeliusCDNUrl(metadata);
            const symbol = metadata?.token_info?.symbol || token.symbol;

            return {
                symbol: symbol,
                name: token.name,
                iconImageUrl: token.iconImageUrl || imageUrl,
                contractAddress: token.contractAddress,
                coinGeckoTokenId: token.coingeckoId,
                provider: token.provider as AccountProvider,
                type: "FungibleToken",
                isStrict: token.isStrict,
            };
        })
        .filter(isAllowedToken);

    return success(tokens);
};

const _handleSearchForContractAddresses = async (
    blacklistObj: Dictionary<Maybe<BlacklistReason>>,
    contractAddresses: { contractAddress: string }[]
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenRootTypes["GetDiscoveryResultsResponse"]["results"]
    >
> => {
    console.time("algolia-search-contracts");

    // search with helius specifically, not algolia
    const tokenResponse = await helius.tokens.metadataDAS(
        contractAddresses.map((a) => a.contractAddress)
    );

    if (tokenResponse.isFailure()) {
        return failure(tokenResponse.error);
    }

    const rawTokens = tokenResponse.value;

    const tokens = rawTokens
        .map((token): NexusGenRootTypes["DiscoveryResult"] => ({
            symbol:
                token.token_info.symbol ||
                token?.content?.metadata?.symbol ||
                "",
            name:
                token?.content?.metadata?.name || token.token_info.symbol || "",
            iconImageUrl:
                getHeliusCDNUrl(token) || token?.content?.links?.image || null,
            contractAddress: token.id,
            coinGeckoTokenId: null,
            provider: AccountProvider.Solana,
            type: "FungibleToken",
            isStrict: false,
        }))
        .filter(
            (t) =>
                // filter blacklist
                !blacklistObj[
                    TokenService.buildKey(
                        t.provider as AccountProvider,
                        t.contractAddress
                    )
                ]
        );

    return success(tokens);
};

// if this is the file, call getJupiterTokens
if (require.main === module) {
    void getJupiterTokens({
        search: "usa",
    }).then((response) => {
        if (response.isFailure()) {
            console.error(response.error);
        } else {
            console.log(response.value);
        }
    });
}

export const JupiterTokens = {
    fetchJupiterTokensWithoutCache,
};
