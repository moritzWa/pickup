import BigNumber from "bignumber.js";
import { User } from "src/core/infra/postgres/entities";

// Note: this is used for both sides, so the person being referred and the person referring
// export const MAX_ALLOWED_CLAIMABLE_REFERRALS = 2;

// const MAX_ALLOWED_CLAIMED_CREDIT = 50 * 100; // $50

export const getNewCreditAmount = (
    referredByUser: User,
    creditAmountCents: number
) => {
    // // if the user already has more than the max client, just return (let them keep their credit basically, ex. for a credit match)
    // if (referredByUser.availableCreditCents > MAX_ALLOWED_CLAIMED_CREDIT) {
    //     return referredByUser.availableCreditCents;
    // }

    // otherwise, set their new credit to the sum of the credits, but don't let it go over $50
    const creditCents = new BigNumber(referredByUser.availableCreditCents)
        .plus(creditAmountCents)
        .dp(0)
        .toNumber();

    // allow $50 of credit max
    return Math.min(creditCents, 50 * 100);
};
