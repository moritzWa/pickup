import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { SolanaDiscoveryProvider } from "./providers/solana/solana";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { isValidSolanaAddress } from "src/shared/integrations/providers/solana/utils";
import { logHistogram } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { formatPrice } from "./providers/solana/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { AlgoliaUser, algolia } from "src/utils/algolia";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { keyBy, uniqBy } from "lodash";
import { In } from "typeorm";
import { MarketCapVolumeService } from "src/modules/tokens/services/marketCapVolumeService";
import { TOKEN_OVERRIDES } from "src/shared/integrations/providers/solana/contracts";

export const getDiscoverySearchResults = async (
    search: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenObjects["GetDiscoveryResultsResponse"]
    >
> => {
    const start = Date.now();
    // check if it is a valid solana address - if so, jupiter. else, coingecko
    const isValid = await isValidSolanaAddress(search);

    const [tokensResp, usersResp, categoriesResp] = await Promise.all([
        // get jupiter tokens
        SolanaDiscoveryProvider.jupiter.getJupiterTokens(
            isValid
                ? {
                      contractAddresses: [
                          {
                              contractAddress: search,
                          },
                      ],
                  }
                : {
                      search,
                  }
        ),
        // get users
        _getUsers(search),
        algolia.categories.search(search),
    ]);

    if (tokensResp.isFailure()) return failure(tokensResp.error);
    if (usersResp.isFailure()) return failure(usersResp.error);
    if (categoriesResp.isFailure()) return failure(categoriesResp.error);
    const categories = categoriesResp.value.hits;

    // log
    const end = Date.now();
    logHistogram({
        metric: "get_discovery_search_results.duration",
        value: end - start,
        tags: { isValid: isValid.toString() },
    });

    const tokens = tokensResp.value;
    const addresses = tokens.map((t) => t.contractAddress);

    // prices & missing metadata
    const [
        pricesResponse,
        metadatasResponse,
        dbTokensResp,
        marketCapVolumeResp,
    ] = await Promise.all([
        birdeye.getMultiPrice(addresses),
        TokenMetadataService.getTokenMetadatas(
            tokens
                .filter((a) => !a.name || !a.symbol || !a.iconImageUrl)
                .map((a) => ({
                    provider: AccountProvider.Solana,
                    contractAddress: a.contractAddress,
                }))
        ),
        TokenService.find({
            where: {
                provider: AccountProvider.Solana,
                contractAddress: In(addresses),
            },
        }),
        MarketCapVolumeService.getMarketCapAndVolume(
            tokens.map((t) => ({
                provider: t.provider as AccountProvider,
                contractAddress: t.contractAddress,
            }))
        ),
    ]);
    if (pricesResponse.isFailure()) return failure(pricesResponse.error);
    if (dbTokensResp.isFailure()) return failure(dbTokensResp.error);

    const marketCapMapping = marketCapVolumeResp.isSuccess()
        ? keyBy(marketCapVolumeResp.value, (t) => t.contractAddress)
        : {};

    const dbTokensObj = keyBy(dbTokensResp.value, (t) =>
        TokenService.buildKey(t.provider, t.contractAddress)
    );

    // merge prices
    const prices = pricesResponse.value;
    tokens.forEach((t) => {
        const priceData = prices[t.contractAddress];
        const marketCap = marketCapMapping[t.contractAddress];

        if (marketCap) {
            t.marketCap = marketCap.marketCap;
            t.vol24h = marketCap.vol24h;
        }

        if (priceData) {
            t.priceFormatted = formatPrice(priceData.value);
            t.priceChangePercentage24h = priceData.priceChange24h;
            t.priceChangePercentage24hFormatted =
                t.priceChangePercentage24hFormatted = t.priceChangePercentage24h
                    ? `${t.priceChangePercentage24h.toFixed(2)}%`
                    : null;
        }
    });

    // merge metadatas
    if (metadatasResponse.isSuccess()) {
        // don't throw failure if it failed
        const metadatas = metadatasResponse.value || [];
        const metadatasByKey = metadatas.reduce((acc, m) => {
            acc[TokenService.buildKey(m.provider, m.contractAddress)] = m;
            return acc;
        }, {});

        tokens.forEach((token) => {
            const metadata =
                metadatasByKey[
                    TokenService.buildKey(
                        AccountProvider.Solana,
                        token.contractAddress
                    )
                ];
            if (metadata) {
                token.name = metadata.name;
                token.symbol = metadata.symbol;
                token.iconImageUrl = metadata.iconImageUrl;
            }
        });
    }

    // override metadatas
    tokens.forEach((t) => {
        const override = TOKEN_OVERRIDES[t.contractAddress];
        if (override) {
            t.symbol = override.symbol;
            t.iconImageUrl = override.iconImageUrl;
        }
    });

    tokens.forEach((t) => {
        // filter dead tokens
        const dbTokenData =
            dbTokensObj[
                TokenService.buildKey(AccountProvider.Solana, t.contractAddress)
            ];
        if (dbTokenData) {
            t.isDead = dbTokenData.isDead;
            t.iconImageUrl = dbTokenData.iconImageUrl || t.iconImageUrl;
            t.isMovementVerified = dbTokenData.isMovementVerified;
            t.isClaimed = dbTokenData.isClaimed;
        }
    });

    const filteredTokens = uniqBy(
        tokens.filter((t) => !t.isDead),
        (t) => t.contractAddress
    );

    // new: sort by (strict, vol24h)
    filteredTokens.sort((a, b) => {
        if (a.isMovementVerified && !b.isMovementVerified) {
            return -1;
        }
        if (!a.isMovementVerified && b.isMovementVerified) {
            return 1;
        }
        if (a.isStrict && !b.isStrict) {
            return -1;
        }
        if (!a.isStrict && b.isStrict) {
            return 1;
        }
        if (a.isClaimed && !b.isClaimed) {
            return -1;
        }
        if (!a.isClaimed && b.isClaimed) {
            return 1;
        }
        if (
            a.vol24h !== null &&
            a.vol24h !== undefined &&
            b.vol24h !== null &&
            b.vol24h !== undefined
        ) {
            return Number(b.vol24h) - Number(a.vol24h);
        }
        return 0;
    });

    return success({
        categories: categories,
        results: filteredTokens,
        users: usersResp.value,
    });
};
const _getUsers = async (
    search: string
): Promise<FailureOrSuccess<DefaultErrors, AlgoliaUser[]>> => {
    const [
        /*algoliaUsersResponse,*/
        userResponse,
    ] = await Promise.all([
        // algolia.users.search(search),
        pgUserRepo.findByUsername(search),
    ]);

    // if (algoliaUsersResponse.isFailure()) {
    //     return failure(algoliaUsersResponse.error);
    // }

    if (userResponse.isFailure()) {
        return failure(userResponse.error);
    }

    const users = userResponse.value;

    // console.log(`[algolia: ${algoliaUsersResponse.value.hits.length}]`);
    // console.log(`[users: ${users.length}]`);

    const allUsers = [
        // ...algoliaUsersResponse.value.hits,
        ...users.map(
            (u): AlgoliaUser => ({
                name: u.name || "",
                username: u.username || "",
                objectID: u.id,
            })
        ),
    ];

    const uniqUsers = uniqBy(allUsers, (u) => u.username);

    return success(uniqUsers);
};
