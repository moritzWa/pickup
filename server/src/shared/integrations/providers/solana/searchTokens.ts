import { NotFoundError, failure, success } from "src/core/logic";
import {
    Position,
    TokenSearchResult,
    TradingIntegrationProviderService,
} from "../../types";
import { connect } from "src/core/infra/postgres";
import {
    AccountProvider,
    TradingSide,
    User,
} from "src/core/infra/postgres/entities";
import { SOL_USDC_MINT, WRAPPED_SOL_MINT } from "./constants";
import { DEFAULT_TOKENS } from "./tokens";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import { isValidSolanaAddress } from "./utils";
import { getToken } from "./getToken";
import { SolanaDiscoveryProvider } from "src/modules/discovery/services/discoveryService/providers/solana";
import { STABLE_COIN_IDENTIFIERS } from "src/shared/domain/stablecoins";
import { helius } from "src/utils";
import BigNumber from "bignumber.js";
import { uniqBy } from "lodash";

const USDC = {
    coingeckoTokenId: CoinGeckoTokenId.USDC,
    iconImageUrl: "https://assets.movement.market/coins/usdc.png",
    symbol: "USDC",
    provider: AccountProvider.Solana,
    contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USDC",
};

const SOL = {
    coingeckoTokenId: CoinGeckoTokenId.Solana,
    iconImageUrl:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/coins%2Fsol.png?alt=media&token=12cf8371-b089-48a7-9268-34a88f43a1e3",
    symbol: "SOL",
    provider: AccountProvider.Solana,
    contractAddress: WRAPPED_SOL_MINT,
    name: "Solana",
};

export const searchTokens: TradingIntegrationProviderService["searchTokens"] =
    async ({ search, user, side }) => {
        const isValidSolanaAccount = await isValidSolanaAddress(search || "");

        if (search && isValidSolanaAccount) {
            console.log(`[looking up mint ${search}]`);

            // look it up
            const tokenResponse = await getToken({
                contractAddress: search,
            });

            if (tokenResponse.isFailure()) {
                return failure(tokenResponse.error);
            }

            const token = tokenResponse.value;

            return success({
                results: [token],
                recommended: token,
            });
        }

        const resultsResponse =
            await SolanaDiscoveryProvider.jupiter.getJupiterTokens({
                search,
            });

        if (resultsResponse.isFailure()) {
            return failure(resultsResponse.error);
        }

        const results = resultsResponse.value;

        const tokens = uniqBy(
            [
                USDC,
                SOL,
                ...results.map((t): TokenSearchResult => {
                    return {
                        coingeckoTokenId: t.coinGeckoTokenId ?? null,
                        iconImageUrl: t.iconImageUrl ?? "",
                        symbol: t.symbol,
                        provider: AccountProvider.Solana,
                        contractAddress: t.contractAddress,
                        name: t.name,
                    };
                }),
            ],
            (t) => t.contractAddress
        );

        const recommended = await _getRecommendedBalance(user, side ?? null);

        return success({
            results: tokens,
            recommended: recommended ?? null,
        });
    };

const _getRecommendedBalance = async (
    user: User | null,
    side: TradingSide | null
): Promise<TokenSearchResult> => {
    try {
        if (!user) {
            return USDC;
        }

        // if selling -> always recommend selling for USDC
        if (side && side === TradingSide.Sell) {
            return USDC;
        }

        if (user) {
            const wallet = (user?.wallets ?? []).find(
                (w) => w.provider === AccountProvider.Solana
            );

            if (wallet && wallet.publicKey) {
                const balancesResponse = await helius.wallets.allBalances(
                    wallet.publicKey
                );

                if (balancesResponse.isSuccess()) {
                    const { balances, nativeBalance } = balancesResponse.value;

                    const usdcBalance = balances.find(
                        (b) => b.id === SOL_USDC_MINT
                    );

                    const usdcBalanceAmount = new BigNumber(
                        usdcBalance?.token_info?.balance ?? 0
                    );

                    // if there is no USDC, and there is some SOL, use the SOL
                    if (!usdcBalance && nativeBalance.gt(0.001)) {
                        return SOL;
                    }

                    // if the usdc balance is sub a penny and there is a native balance, use the SOL instead
                    if (
                        !!usdcBalance &&
                        usdcBalanceAmount.lt(10_000) &&
                        nativeBalance.gt(0.001)
                    ) {
                        return SOL;
                    }

                    // otherwise always use USDC
                    return USDC;
                }
            }
        }

        return USDC;
    } catch (err) {
        return USDC;
    }
};

if (require.main === module) {
    connect()
        .then(async () => {})
        .catch(console.error)
        .finally(() => process.exit(1));
}
