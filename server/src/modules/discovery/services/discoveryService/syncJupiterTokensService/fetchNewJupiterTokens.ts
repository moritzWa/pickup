import {
    FailureOrSuccess,
    DefaultErrors,
    success,
    failure,
    failureAndLog,
} from "src/core/logic";
import { v4 as uuidv4 } from "uuid";
import { algolia } from "src/utils/algolia";
import { DiscoveryJupiterTokensCacheService } from "../discoveryJupiterTokensCache";
import { JupTokenWithStrictTag } from "../providers/solana/jupiter";
import { coingecko, logHistogram } from "src/utils";
import { SolanaDiscoveryProvider } from "../providers/solana";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { TokenParams } from "src/modules/tokens/postgres/tokenRepository";
import { chunk, keyBy } from "lodash";
import { nanoid } from "nanoid";
import { birdeye } from "src/utils/birdeye";
import { MemecoinLinkType } from "src/core/infra/postgres/entities/Token";
import { DexScreenerService } from "src/utils/dexscreener";

const PROVIDER = AccountProvider.Solana;

export const fetchNewJupiterTokens = async (
    filterAddreses?: Token[]
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const start = Date.now();

    // fetch jupiter tokens
    const jupiterTokensResp =
        await SolanaDiscoveryProvider.jupiter.fetchJupiterTokensWithoutCache();
    if (jupiterTokensResp.isFailure())
        return failureAndLog({
            error: jupiterTokensResp.error,
            message: jupiterTokensResp.error.message,
        });
    const jupiterTokens = jupiterTokensResp.value;
    const cacheResponse = await DiscoveryJupiterTokensCacheService.set(
        jupiterTokens
    );
    if (cacheResponse.isFailure()) {
        return failure(cacheResponse.error);
    }

    // fetch algolia tokens
    const oldTokensResp = await TokenService.find({});
    if (oldTokensResp.isFailure()) return failure(oldTokensResp.error);
    const oldTokens = oldTokensResp.value;
    const addressSet = new Set(oldTokens.map((t) => t.contractAddress));
    // const algoliaTokensResp = await algolia.tokens.fetchAll();
    // if (algoliaTokensResp.isFailure()) return failure(algoliaTokensResp.error);
    // const algoliaTokens = algoliaTokensResp.value;
    // const algoliaAddressSet = new Set(
    //     algoliaTokens.map((t) => t.contractAddress)
    // );

    // diff
    const newTokens = jupiterTokens.filter(
        (jt) =>
            !addressSet.has(jt.contractAddress) &&
            (filterAddreses !== undefined
                ? filterAddreses.some(
                      (t) =>
                          TokenService.buildKey(
                              AccountProvider.Solana,
                              t.contractAddress
                          ) ===
                          TokenService.buildKey(
                              AccountProvider.Solana,
                              jt.contractAddress
                          )
                  )
                : true)
    );

    // save new tokens only (we don't want to override algolia tokens' fdv / created at / etc)
    const rows: TokenParams[] = newTokens.map((token) => ({
        ...token,
        fdv: null,
        cdnHeroImageUrl: null,
        cdnOriginalImageUrl: null,
        hasAddedToCdn: false,
        cdnThumbnailImageUrl: null,
        isClaimed: false,
        bestLpPoolAddress: null,
        isMovementVerified: false,
        fdvUpdatedAtUnixStr: null,
        fdvDNE: null,
        slug: encodeURI(`${token.symbol}-${nanoid()}`.toLowerCase()),
        tokenCreatedAtUnixStr: null,
        tokenCreatedAtDNE: null,
        vol24h: null,
        id: uuidv4(),
        coingeckoId: null,
        isFreezeable: null,
        provider: ACCOUNT_PROVIDER_GQL_TO_DOMAIN[token.provider],
        iconImageUrl: token.iconImageUrl || "",
        isDead: null,
        isDeadEnum: null,
        twitterLink: null,
        websiteLink: null,
        description: null,
        bannerUrl: null,
        telegramLink: null,
        isBlacklisted: null,
        moreLinks: TokenService.createDefaultLinks(token.contractAddress),
        irlName: null,
        numVotes: 0,
        // lastCheckedIsDeadUnixStr: null,
    }));

    const chunksOf10k = chunk(rows, 1_000);

    for (const ch of chunksOf10k) {
        const dbSaveResp = await TokenService.createMany(ch);
        if (dbSaveResp.isFailure()) return failure(dbSaveResp.error);
    }

    const response = await algolia.tokens.save(
        rows.map((r) => ({
            ...r,
            objectID: r.contractAddress,
            provider: r.provider.toString(),
        }))
    );
    console.log("Saved " + rows.length + " new tokens");

    // Update is_strict on any tokens in our DB
    const updateIsStrictResp = await _updateIsStrict(jupiterTokens);
    if (updateIsStrictResp.isFailure())
        return failure(updateIsStrictResp.error);

    // // Add social links
    // const addSocialLinksResp = await _addSocialLinks(jupiterTokens);
    // if (addSocialLinksResp.isFailure())
    //     return failure(addSocialLinksResp.error);

    const end = Date.now();

    logHistogram({
        metric: "fetch_new_jupiter_tokens.duration",
        value: end - start,
        logIfOver: 30_000,
    });

    return success(null);
};

export const _updateIsStrict = async (
    allJupTokens: JupTokenWithStrictTag[]
): Promise<FailureOrSuccess<DefaultErrors, number>> => {
    let affected = 0;

    // get our DB tokens
    const tokensDBResp = await TokenService.find({});
    if (tokensDBResp.isFailure()) return failure(tokensDBResp.error);
    const tokensDB = tokensDBResp.value;
    const tokensDBMap = keyBy(tokensDB, (t) =>
        TokenService.buildKey(t.provider, t.contractAddress)
    );

    // update is_strict
    for (const jupToken of allJupTokens) {
        const tokenDB =
            tokensDBMap[
                TokenService.buildKey(
                    AccountProvider.Solana,
                    jupToken.contractAddress
                )
            ];
        if (!tokenDB) continue;

        if (tokenDB.isStrict !== jupToken.isStrict) {
            // update token
            const updateResp = await TokenService.update(tokenDB.id, {
                isStrict: jupToken.isStrict,
            });
            if (updateResp.isFailure()) return failure(updateResp.error);
            // update algolia
            await algolia.tokens.save([
                {
                    ...tokenDB,
                    objectID: tokenDB.contractAddress,
                    isStrict: jupToken.isStrict,
                },
            ]);
            affected += 1;
        }
    }

    return success(affected);
};

const MAX_NUM_FAIL = 0.1; // if 10% fail, return;
export const _addSocialLinks = async (
    allJupTokens: JupTokenWithStrictTag[]
): Promise<FailureOrSuccess<DefaultErrors, number>> => {
    let numUpdated = 0;
    let numFailed = 0;

    for (const jupToken of allJupTokens) {
        // get token from DB
        const tokenResp = await TokenService.findOne({
            where: {
                contractAddress: jupToken.contractAddress,
                provider: PROVIDER,
            },
        });
        if (tokenResp.isFailure()) continue;
        const token = tokenResp.value;

        // check num failures
        if (numFailed > 0 && numFailed > MAX_NUM_FAIL * allJupTokens.length) {
            return failure(
                new Error("Too many failures for adding social links")
            );
        }

        // fetch data
        const [tokenOverviewResp, coingeckoContractResp, coingeckoDexResp] =
            await Promise.all([
                birdeye.getTokenOverview(
                    PROVIDER,
                    jupToken.contractAddress,
                    true,
                    "fetchNewJupiterTokens()"
                ),
                coingecko.getCoingeckoForContract(
                    PROVIDER,
                    jupToken.contractAddress
                ),
                coingecko.dex.getTokens(PROVIDER, [jupToken.contractAddress]),
            ]);
        if (tokenOverviewResp.isFailure()) {
            numFailed += 1;
            continue;
        }
        // if (coingeckoContractResp.isFailure()) <- fails for too many coins, unreliable
        //     return failure(coingeckoContractResp.error);
        const tokenOverview = tokenOverviewResp.value.data;
        const coingeckoContract = coingeckoContractResp.isSuccess()
            ? coingeckoContractResp.value
            : undefined;

        // best pool address
        let bestLpPoolAddress: string | undefined = undefined;
        if (!token.bestLpPoolAddress && coingeckoDexResp.isSuccess()) {
            const coingeckoDex = coingeckoDexResp.value[0];
            const bestPoolAddress = coingecko.getBestPoolFromResp(coingeckoDex);
            bestLpPoolAddress = bestPoolAddress;
        }

        let moreLinks = token.moreLinks;
        if (moreLinks.length === 0) {
            moreLinks = [
                {
                    type: MemecoinLinkType.Coingecko,
                    url: tokenOverview?.extensions?.coingeckoId
                        ? coingecko.getTokenURL(
                              tokenOverview?.extensions?.coingeckoId
                          )
                        : "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.Coingecko
                    ),
                },
                {
                    type: MemecoinLinkType.Website,
                    url: tokenOverview?.extensions?.website || "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.Website
                    ),
                },
                {
                    type: MemecoinLinkType.Telegram,
                    url: tokenOverview?.extensions?.telegram || "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.Telegram
                    ),
                },
                {
                    type: MemecoinLinkType.Twitter,
                    url: tokenOverview?.extensions?.twitter || "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.Twitter
                    ),
                },
                {
                    type: MemecoinLinkType.Discord,
                    url: tokenOverview?.extensions?.discord || "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.Discord
                    ),
                },
                {
                    type: MemecoinLinkType.Medium,
                    url: tokenOverview?.extensions?.medium || "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.Medium
                    ),
                },
                {
                    type: MemecoinLinkType.DexScreener,
                    url: bestLpPoolAddress
                        ? `${DexScreenerService.getDexScreenerURL()}/${bestLpPoolAddress}`
                        : "",
                    alwaysShow: TokenService.shouldAlwaysShow(
                        MemecoinLinkType.DexScreener
                    ),
                },
            ].filter((l) => l.url);
        }

        const description =
            token.description || // don't override existing description
            tokenOverview?.extensions?.description ||
            coingeckoContract?.description?.en ||
            undefined;

        // update token
        const updates: Partial<Token> = {};
        if (moreLinks.length > 0) {
            updates.moreLinks = moreLinks;
        }
        if (description) updates.description = description;
        if (bestLpPoolAddress) updates.bestLpPoolAddress = bestLpPoolAddress;
        if (Object.keys(updates).length > 0) {
            const updateResp = await TokenService.update(token.id, updates);
            if (updateResp.isFailure()) return failure(updateResp.error);
        }

        numUpdated += 1;
    }

    return success(numUpdated);
};
