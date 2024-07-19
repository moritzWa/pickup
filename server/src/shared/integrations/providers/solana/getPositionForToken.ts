import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import {
    TradingIntegrationProviderService,
    Token,
    TokenPosition,
} from "../../types";
import { ZERO_BN, coingecko, helius } from "src/utils";
import { connect } from "src/core/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { getCoingeckoForToken } from "src/shared/coingecko/getCoingeckoForToken";
import { AccountProvider } from "src/core/infra/postgres/entities";
import BigNumber from "bignumber.js";
import { WRAPPED_SOL_MINT } from "./constants";
import { isNil } from "lodash";
import { getToken } from "./getToken";

const PROVIDER = AccountProvider.Solana;

export const getPositionForToken: TradingIntegrationProviderService["getPositionForToken"] =
    async ({
        token: _token,
        walletAddress,
    }): Promise<FailureOrSuccess<DefaultErrors, TokenPosition>> => {
        const contractAddress = _token.contractAddress;

        // FIXME: can prob remove this? don't want to test atm tho
        const tokenInfoResponse = await helius.tokens.metadataV2(
            contractAddress
        );

        const balancesResponse = await helius.wallets.allBalances(
            walletAddress
        );

        if (balancesResponse.isFailure()) {
            return failure(balancesResponse.error);
        }

        if (tokenInfoResponse.isFailure()) {
            return failure(tokenInfoResponse.error);
        }

        const balanceInfo =
            balancesResponse.value.balances.find(
                (b) => b.id === contractAddress
            ) ?? null;
        const tokenInfo = tokenInfoResponse.value;
        const mintAddress = tokenInfo.id; // same as the contract address

        const coingeckoIdResponse = await getCoingeckoForToken(
            PROVIDER,
            mintAddress
        );

        const coingeckoId = coingeckoIdResponse.isSuccess()
            ? coingeckoIdResponse.value
            : null;

        const currentPriceResponse = await coingecko.getPriceDollars({
            tokenId: coingeckoId,
            provider: PROVIDER,
            contractAddress: mintAddress,
        });

        if (currentPriceResponse.isFailure()) {
            return failure(currentPriceResponse.error);
        }

        const currentPrice = currentPriceResponse.value;

        const rawBalance =
            contractAddress === WRAPPED_SOL_MINT
                ? balancesResponse.value.nativeBalance
                : new BigNumber(balanceInfo?.token_info?.balance ?? 0).div(
                      new BigNumber(10).pow(tokenInfo.token_info.decimals)
                  );

        const amount = new BigNumber(rawBalance);

        const priceCents = !isNil(currentPrice?.usd)
            ? new BigNumber(currentPrice?.usd ?? 0).multipliedBy(100)
            : ZERO_BN;

        const fiatAmountCents = new BigNumber(amount).multipliedBy(priceCents);

        const token: TokenPosition = {
            isNativeToken: false,
            symbol: tokenInfo.token_info.symbol,
            contractAddress: mintAddress,
            provider: PROVIDER,
            coingeckoTokenId: coingeckoId,
            priceCents: priceCents,
            iconImageUrl: tokenInfo.content.links.image,
            amount,
            fiatAmountCents,
            fiatCurrency: "USD",
        };

        return success(token);
    };

if (require.main === module) {
    connect()
        .then(async () => {
            const token = await getToken({
                contractAddress: "69kdRLyP5DTRkpHraaSZAQbWmAwzF9guKjZfzMXzcbAs",
            });

            const response = await getPositionForToken({
                token: token.value,
                walletAddress: "GWaxhgByJRYwQUrj3LzG1L1LzNm5cqB227WqzNLQBzLK",
            });
            // const response = await getToken({
            //     contractAddress: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
            // });
            // console.log(response);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
