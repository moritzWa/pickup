import { Magic } from "@magic-sdk/admin";
import BigNumber from "bignumber.js";
import moment = require("moment");
import { AccountProvider, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { ZERO_BN, coingecko, sumBigNumbers } from "src/utils";
import { withdrawalRepo } from "../infra";
import { Between, MoreThanOrEqual } from "typeorm";

const MAX_WITHDRAWALS = 3;

export const canWithdraw = async (
    user: User,
    provider: AccountProvider,
    mintAddress: string,
    amount: number
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const claimedAt = user.initialDepositClaimedAt;
    // if it is less than 30 days from when they claimedAt, return an error
    const oneMonth = moment(claimedAt).add({ days: 30 });

    if (!user.canWithdraw) {
        return failure(new Error("You are not allowed to withdraw."));
    }

    const withdrawalsTodayResponse = await withdrawalRepo.findForUser(user.id, {
        where: {
            createdAt: MoreThanOrEqual(moment().subtract({ days: 1 }).toDate()),
        },
    });

    if (withdrawalsTodayResponse.isFailure()) {
        return failure(withdrawalsTodayResponse.error);
    }

    const numWithdrawalsToday = new BigNumber(
        withdrawalsTodayResponse.value.length
    );

    const maxWithdrawals = new BigNumber(
        user.maxDailyWithdrawals || MAX_WITHDRAWALS
    );

    if (numWithdrawalsToday.gte(maxWithdrawals)) {
        return failure(
            new Error(
                `You can only withdraw ${maxWithdrawals.toNumber()} times per day. Please contact support if you need help.`
            )
        );
    }

    // // if no claim initial deposit, they can withdraw whatever they want
    // if (!user.hasClaimedInitialDeposit) {
    //     return success(null);
    // }

    // // if they did claim, but it is more than one month from when they claimed that is fine
    // // just let them withdraw
    // if (claimedAt && oneMonth.toDate() < new Date()) {
    //     return success(null);
    // }

    // get the user positions for the tokens they have
    const positionsResponse = await MagicPortfolioService.getFullPositions(
        user,
        false
    );

    if (positionsResponse.isFailure()) {
        return failure(positionsResponse.error);
    }

    // get the price for this token
    const tokenPriceResponse = await coingecko.getCurrentPriceDollarsFromDEX(
        provider,
        [mintAddress]
    );

    if (tokenPriceResponse.isFailure()) {
        return failure(tokenPriceResponse.error);
    }

    const priceForToken = tokenPriceResponse.value.find(
        (price) => price.contract === mintAddress
    );

    // Note: just allowing this for now. if a token is not priced / liquid, we still want to let them withdraw
    if (!priceForToken) {
        return success(null);
    }

    const valueOfWithdrawCents = new BigNumber(priceForToken.priceUsdDollars)
        .multipliedBy(100)
        .multipliedBy(amount);

    if (valueOfWithdrawCents.lt(100)) {
        return failure(
            new Error(
                "You must withdraw at least $1.00 of tokens. Please contact support if you have questions and we can help you out."
            )
        );
    }

    const totalPortfolioCents = sumBigNumbers(
        positionsResponse.value.map(
            (position) => position.totalFiatAmountCents ?? ZERO_BN
        )
    );

    const amountUserClaimedCents = new BigNumber(
        user.initialDepositAmount ?? 0
    ).multipliedBy(100); // this is USDC for now so that is okay

    const amountAfterWithdrawal =
        totalPortfolioCents.minus(valueOfWithdrawCents);

    // make sure this is more than they claimed
    if (amountAfterWithdrawal.isLessThan(amountUserClaimedCents)) {
        return failure(
            new Error(
                `You cannot withdraw your free ${user.initialDepositAmount} ${user.initialDepositTokenSymbol} for 30 days. If you need help, message customer support.`
            )
        );
    }

    return success(null);
};
