import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { Datadog } from "../datadog";
import { AxiosError } from "axios";
import { client } from "./client";
import { Dictionary } from "lodash";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { connect } from "src/core/infra/postgres";
import { redisPersisted } from "../cache";
import { Helpers } from "../helpers";

// 12 hours
const CACHE_TTL_SECONDS = 12 * 60 * 60;

type GetTokenSecurityResponse = {
    // data: {
    creatorAddress: string | null;
    ownerAddress: string | null;
    creationTx: string | null;
    creationTime: string | null;
    creationSlot: string | null;
    mintTx: string | null;
    mintTime: string | null;
    mintSlot: string | null;
    creatorBalance: number | null;
    ownerBalance: number | null;
    ownerPercentage: number | null;
    creatorPercentage: number | null;
    metaplexUpdateAuthority: string;
    metaplexUpdateAuthorityBalance: number;
    metaplexUpdateAuthorityPercent: number;
    mutableMetadata: boolean;
    top10HolderBalance: number;
    top10HolderPercent: number;
    top10UserBalance: number;
    top10UserPercent: number;
    isTrueToken: boolean | null;
    totalSupply: number;
    preMarketHolder: any[]; // Replace 'any' with a more specific type if possible
    lockInfo: any | null; // Replace 'any' with a more specific type if possible
    freezeable: boolean | null;
    freezeAuthority: string | null;
    transferFeeEnable: boolean | null;
    transferFeeData: any | null; // Replace 'any' with a more specific type if possible
    isToken2022: boolean;
    nonTransferable: boolean | null;
    // };
    // success: boolean;
    // statusCode: number;
};

export const getTokenSecurity = async (
    provider: AccountProvider,
    address: string,
    canUseCache: boolean,
    location: string
): Promise<FailureOrSuccess<DefaultErrors, GetTokenSecurityResponse>> => {
    try {
        const cacheKey = `bird_security:${provider}_${address}`;

        if (canUseCache) {
            const cachedData = await redisPersisted.get(cacheKey);

            if (cachedData) {
                const response =
                    Helpers.maybeParseJSON<GetTokenSecurityResponse>(
                        cachedData
                    );

                if (response.isSuccess() && response.value) {
                    Datadog.increment(
                        "birdeye.get_token_security.cache_hit.ok",
                        1
                    );

                    return success(response.value);
                }
            } else {
                Datadog.increment(
                    "birdeye.get_token_security.cache_hit.miss",
                    1
                );
            }
        }

        const response = await client.get<{ data: GetTokenSecurityResponse }>(
            "/defi/token_security",
            {
                params: {
                    address,
                },
            }
        );

        if (response.status !== 200) {
            return failure(new Error("Failed to fetch token security"));
        }

        if (response.data) {
            await redisPersisted.set(
                cacheKey,
                JSON.stringify(response.data.data),
                "EX",
                CACHE_TTL_SECONDS
            );
        }

        Datadog.increment("birdeye.get_token_security.ok", 1, { location });

        return success(response.data.data);
    } catch (error) {
        const tags = { location };
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";
        }

        Datadog.increment("birdeye.get_token_security.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};

if (require.main === module) {
    connect()
        .then(async () => {
            const response = await getTokenSecurity(
                AccountProvider.Solana,
                "So11111111111111111111111111111111111111112",
                true,
                "script - getTokenSecurity()"
            );
            console.log(response);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
