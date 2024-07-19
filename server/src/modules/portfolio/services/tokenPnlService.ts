import {
    AccountProvider,
    CurrencyCode,
    User,
} from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { TradingIntegrationService } from "src/shared/integrations";
import { getWalletTypeForMagic, magic } from "src/utils/magic";
import { CostBasisService } from "./costBasis";
import BigNumber from "bignumber.js";
// @ts-ignore
import * as numbro from "numbro";
import { D } from "src/utils";
import { WRAPPED_SOL_MINT } from "src/shared/integrations/providers/solana/constants";
import { swapRepo } from "src/modules/trading/infra/postgres";
import { CostBasisData } from "./costBasis/getCostBasis";
import { isNil } from "lodash";
import { TokenPosition } from "src/shared/integrations/types";

export type PnlInfo = {
    position: TokenPosition;
    hasPendingSwaps: boolean;
    costBasis: CostBasisData;
    doNotShowBasis: boolean;
    totalReturnFormatted: string | null;
    totalReturnPercentage: number | null;
    avgCostBasisFiatAmountFormatted: string;
    totalReturnFiatCents: BigNumber | null;
};

export const getPnl = async (
    user: User,
    provider: AccountProvider,
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, PnlInfo>> => {
    const issuer = user.magicIssuer;

    const tradingServiceResponse =
        TradingIntegrationService.getIntegration(provider);

    if (tradingServiceResponse.isFailure()) {
        return failure(tradingServiceResponse.error);
    }
    const tradingService = tradingServiceResponse.value;
    const walletType = getWalletTypeForMagic(provider);

    const walletResponse = await magic.wallets.getPublicAddress(
        issuer,
        walletType
    );

    if (walletResponse.isFailure()) {
        return failure(walletResponse.error);
    }

    const wallet = walletResponse.value;

    if (!wallet || !wallet.publicAddress) {
        return failure(new UnexpectedError("Could not find wallet."));
    }

    const tokenResponse = await TokenService.getToken({
        provider,
        contractAddress,
    });

    if (tokenResponse.isFailure()) {
        return failure(tokenResponse.error);
    }

    const token = tokenResponse.value;

    const positionResponse = await tradingService.getPositionForToken({
        token,
        walletAddress: wallet.publicAddress,
    });

    if (positionResponse.isFailure()) {
        return failure(positionResponse.error);
    }

    const position = positionResponse.value;

    const costBasisResponse = await CostBasisService.getCostBasis(
        user.id,
        position
    );

    if (costBasisResponse.isFailure()) {
        return failure(costBasisResponse.error);
    }

    const costBasis = costBasisResponse.value;

    // if it is less an a penny each, we need to allow more decimals
    const avgCostBasisFiatAmountFormatted = _formatAvg(costBasis);
    const hasCostBasis = !isNil(costBasis.currentCostBasisCents);

    const totalReturnFiatCents = hasCostBasis
        ? new BigNumber(position.fiatAmountCents.toNumber()).minus(
              costBasis.currentCostBasisCents ?? 0
          )
        : null;

    const totalReturnFormatted = totalReturnFiatCents
        ? D(totalReturnFiatCents.dp(0).toNumber(), CurrencyCode.USD).toFormat()
        : null;

    const totalReturnPercentage = _getTotalReturnPercentage(
        costBasis.currentCostBasisCents,
        position.fiatAmountCents
    );

    const doNotShowBasis =
        costBasis.isStableCoin ||
        !hasCostBasis ||
        contractAddress === WRAPPED_SOL_MINT;

    const hasPendingSwapsResponse = await swapRepo.hasPending(user.id);

    if (hasPendingSwapsResponse.isFailure()) {
        return failure(hasPendingSwapsResponse.error);
    }

    const hasPendingSwaps =
        hasPendingSwapsResponse.value &&
        !position.amount.eq(costBasis.currentBalance ?? 0);

    return success({
        position,
        hasPendingSwaps,
        costBasis,
        doNotShowBasis,
        totalReturnFormatted,
        totalReturnPercentage,
        avgCostBasisFiatAmountFormatted,
        totalReturnFiatCents,
    });
};

const _formatAvg = (costBasis: CostBasisData) => {
    const hasAvg = !!costBasis.averagePurchasePriceCents;

    // weird stuff with numbro, just hacking to get it to work
    const n = numbro as any;

    return hasAvg &&
        costBasis
            .averagePurchasePriceCents!.dp(0, BigNumber.ROUND_DOWN)
            .abs()
            .lte(1)
        ? // allow 10 decimals and then convert back to dollars and round
          "$" +
              n(
                  costBasis
                      .averagePurchasePriceCents!.div(100)
                      .dp(10)
                      .toNumber()
              ).format("0.[0000000000]")
        : D(
              Math.floor(costBasis.averagePurchasePriceCents?.toNumber() ?? 0),
              CurrencyCode.USD
          ).toFormat();
};

const _getTotalReturnPercentage = (
    costBasis: Maybe<BigNumber>,
    currentPrice: BigNumber
) => {
    if (!costBasis) {
        return null;
    }

    if (costBasis.isZero()) {
        return null;
    }

    const diff = currentPrice.minus(costBasis);
    const percentage = diff.div(costBasis).multipliedBy(100);

    if (percentage.isNaN()) {
        return null;
    }

    return percentage.dp(2).toNumber();
};

export const TokenPnlService = {
    getPnl,
};
