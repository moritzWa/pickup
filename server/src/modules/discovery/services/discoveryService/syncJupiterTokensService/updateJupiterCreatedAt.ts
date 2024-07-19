import {
    FailureOrSuccess,
    DefaultErrors,
    success,
    failure,
    failureAndLog,
    hasValue,
} from "src/core/logic";
import { algolia } from "src/utils/algolia";
import { DiscoveryJupiterTokensCacheService } from "../discoveryJupiterTokensCache";
import {
    JupTokenWithStrictTag,
    fetchJupiterTokensWithoutCache,
} from "../providers/solana/jupiter";
import {
    AccountProvider,
    AssetType,
    Token,
} from "src/core/infra/postgres/entities";
import { Dictionary } from "lodash";
import { DateTime } from "luxon";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { coingecko, logHistogram } from "src/utils";

const MAX_UPDATES = 9000;

export const updateJupiterCreatedAt = async (): Promise<
    FailureOrSuccess<DefaultErrors, null>
> => {
    const start = Date.now();

    // get all tokens from algolia
    // const tokensResp = await algolia.tokens.fetchAll();
    const tokensResp = await TokenService.find({});
    if (tokensResp.isFailure()) return failure(tokensResp.error);
    const tokens = tokensResp.value;

    // get missing token created ats - the ones where tokenCreatedAtDNE is unset (meaning we haven't checked it)
    const tokensMissingCreatedAt = tokens
        .filter(
            (t) =>
                t.tokenCreatedAtDNE === null ||
                t.tokenCreatedAtDNE === undefined // need undefined for backfill
        )
        .slice(0, MAX_UPDATES);
    const createdAtsResp = await getCreatedAts(
        tokensMissingCreatedAt.map((t) => ({
            ...t,
            provider: t.provider as AccountProvider,
        }))
    );
    if (createdAtsResp.isFailure()) return failure(createdAtsResp.error);
    const createdAts = createdAtsResp.value;

    // save to db & algolia
    const updatedTokens = tokensMissingCreatedAt
        .map((t) => {
            const key = TokenService.buildKey(
                t.provider as AccountProvider,
                t.contractAddress
            );
            if (createdAts[key] === "does_not_exist")
                return {
                    ...t,
                    tokenCreatedAtUnixStr: null,
                    tokenCreatedAtDNE: true,
                };
            else if (createdAts[key]) {
                return {
                    ...t,
                    tokenCreatedAtUnixStr: String(createdAts[key]),
                    tokenCreatedAtDNE: false,
                };
            } else return null;
        })
        .filter(
            // only get the ones that we got the created at for
            hasValue
        );
    const dbSaveResp = await TokenService.saveMany(updatedTokens);
    await algolia.tokens.save(
        updatedTokens.map((t) => ({ ...t, objectID: t.contractAddress }))
    );

    const end = Date.now();

    logHistogram({
        metric: "update_jupiter_created_at.duration",
        value: end - start,
        logIfOver: 30_000,
    });

    console.log(
        "successfully updated jupiter created at for ",
        updatedTokens.length,
        " tokens"
    );

    return success(null);
};

export const getCreatedAts = async (
    tokensMissingCreatedAt: {
        contractAddress: string;
    }[]
): Promise<
    FailureOrSuccess<DefaultErrors, Dictionary<number | "does_not_exist">>
> => {
    const keyToCreatedAt: Dictionary<number | "does_not_exist"> = {};
    const pages = Math.ceil(
        tokensMissingCreatedAt.length / coingecko.dex.MAX_ADDRESSES
    );
    for (let i = 0; i < pages; i++) {
        const tokensPage = tokensMissingCreatedAt
            .map((token) => token.contractAddress)
            .slice(
                i * coingecko.dex.MAX_ADDRESSES,
                (i + 1) * coingecko.dex.MAX_ADDRESSES
            );
        // get pools
        const poolsResp = await coingecko.dex.getTokens(
            AccountProvider.Solana,
            tokensPage
        );
        if (poolsResp.isFailure())
            return failureAndLog({
                error: poolsResp.error,
                message: "Failed to get pools",
            });
        const pools = poolsResp.value;
        const bestPools = pools
            .map((t, i) => {
                const poolsList =
                    t.relationships.top_pools?.data?.map((p) => p.id) ?? [];
                if (poolsList.length > 0)
                    return [tokensPage[i], poolsList[0].split("_")[1]];
                return null;
            })
            .filter(hasValue);

        // get pools created at
        const createdAtsResp = await coingecko.dex.getPools(
            AccountProvider.Solana,
            bestPools.map((p) => p[1]) // p[1] is the pool address
        );
        if (createdAtsResp.isFailure())
            return failureAndLog({
                error: createdAtsResp.error,
                message: `Failed to get pool created at for tokens. Error: ${
                    createdAtsResp.error.message
                }. Page: ${JSON.stringify(tokensPage)}`,
            });
        // rest of the code assumes the two arrays are the same length and returned in the same order
        if (createdAtsResp.value.length !== bestPools.length)
            return failureAndLog({
                error: new Error(
                    "Should never happen: Mismatched pool and pool created at lengths"
                ),
                message:
                    "Should never happen: Mismatched pool and pool created at lengths",
            });
        const _createdAts = createdAtsResp.value;

        // add to map
        for (let i = 0; i < _createdAts.length; i++) {
            keyToCreatedAt[
                TokenService.buildKey(AccountProvider.Solana, bestPools[i][0]) // [0] is the token address
            ] = DateTime.fromISO(_createdAts[i].attributes.pool_created_at)
                .toJSDate()
                .getTime();
        }

        // any ones that we couldn't pull the data for, label as "does not exist"
        tokensPage.forEach((contractAddress) => {
            const key = TokenService.buildKey(
                AccountProvider.Solana,
                contractAddress
            );
            if (!keyToCreatedAt[key]) keyToCreatedAt[key] = "does_not_exist";
        });
    }
    return success(keyToCreatedAt);
};
