import {
    Referral,
    ReferralCommission,
    ReferralPayout,
} from "src/core/infra/postgres/entities";
import { PostgresReferralRepository } from "./postgres/referralRepo";
import { PostgresReferralCommissionFeeRepository } from "./postgres/referralCommissionRepo";
import { PostgresReferralPayoutFeeRepository } from "./postgres/referralPayoutRepo";

export const referralRepo = new PostgresReferralRepository(Referral);
export const referralCommissionRepo =
    new PostgresReferralCommissionFeeRepository(ReferralCommission);
export const referralPayoutRepo = new PostgresReferralPayoutFeeRepository(
    ReferralPayout
);
