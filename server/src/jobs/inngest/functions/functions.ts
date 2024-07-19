import sendNotification from "./sendNotification";
import submitTransaction from "./submitTransaction";
import claimReferralBonus from "./claimReferralBonus";
import onrampDeposit from "./onrampDeposit";
import submitWithdrawal from "./submitWithdrawal";

import {
    sendFeedbackEmail,
    syncPendingSwaps,
    syncJupiterTokens,
    syncUsernames,
    checkDeadTokens,
    howDidYouFindUsEmail,
    warmCategories,
} from "./scheduled";
import claimAirdrop from "./claimAirdrop";
import claimInitialDeposit from "./claimInitialDeposit";
import sendBuyNotifications from "./sendBuyNotifications";
import uploadImageToFirebase from "./uploadImageToFirebase";

export const inngestFunctions = [
    sendNotification,
    submitTransaction,
    submitWithdrawal,
    claimAirdrop,
    claimInitialDeposit,
    claimReferralBonus,
    onrampDeposit,
    sendBuyNotifications,
    uploadImageToFirebase,
];

export const cronInngestFunctions = [
    sendFeedbackEmail,
    syncPendingSwaps,
    syncJupiterTokens,
    syncUsernames,
    checkDeadTokens,
    howDidYouFindUsEmail,
    warmCategories,
];
