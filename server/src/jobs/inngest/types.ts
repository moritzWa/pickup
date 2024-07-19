import { Maybe } from "src/core/logic";
import { NotificationData } from "./functions/types";
import { AccountProvider } from "src/core/infra/postgres/entities";

export enum InngestEventName {
    SendNotification = "notifications/send",
    // SendUserNotifications = "user_notifications/send",
    SubmitTransaction = "transactions/submit",
    SendBuyNotifications = "notifications/buy",
    SubmitWithdrawal = "withdrawals/submit",
    ClaimAirdrop = "airdrops/claim",
    ClaimInitialDeposit = "users/claim_initial_deposit",
    ClaimReferralBonus = "referrals/claim_bonus",
    OnrampDeposit = "deposits/onramp",
    UploadImageToFirebase = "uploads/upload_image_to_firebase",
}

export type CronInngestEvents = {};

export type SubmitTransactionData = {
    userId: string;
    swapId: string;
    blockHeight: number;
    signature: string;
    chain: AccountProvider;
    rawTransaction: string;
};

export type SubmitWithdrawalData = {
    userId: string;
    withdrawalId: string;
    blockHeight: number;
    signature: string;
    chain: AccountProvider;
    rawTransaction: string;
};

export type ClaimAirdropData = {
    airdropClaimId: string;
};

export type ClaimReferralBonusData = {
    referralId: string;
};

export type InngestEvents = {
    [InngestEventName.SendNotification]: {
        data: NotificationData;
    };
    [InngestEventName.SendBuyNotifications]: {
        data: { swapId: string; userId: string };
    };
    [InngestEventName.SubmitTransaction]: {
        data: SubmitTransactionData;
    };
    [InngestEventName.SubmitWithdrawal]: {
        data: SubmitWithdrawalData;
    };
    [InngestEventName.ClaimAirdrop]: {
        data: ClaimAirdropData;
    };
    [InngestEventName.ClaimReferralBonus]: {
        data: ClaimReferralBonusData;
    };
    [InngestEventName.UploadImageToFirebase]: {
        data: {
            imageUrl: string;
            tokenId: string;
        };
    };
    [InngestEventName.ClaimInitialDeposit]: {
        data: {
            userId: string;
        };
    };
    [InngestEventName.OnrampDeposit]: {
        data: {
            depositId: string;
        };
    };
};
