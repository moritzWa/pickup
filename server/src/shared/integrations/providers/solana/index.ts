import { WalletType } from "@magic-sdk/admin";

import { TradingIntegrationProviderService } from "../../types";
import { getDepositInfo } from "./getDepositInfo";
import { getTokenChart } from "./getTokenChart";
import { getPositions } from "./getPositions";
import { getToken } from "./getToken";
import { getTransactions } from "./getTransactions";
import { getPositionForToken } from "./getPositionForToken";
import { searchTokens } from "./searchTokens";
import { getTokenInfo } from "./getTokenInfo";
import { getTokenSecurity } from "./getTokenSecurity";
import { getTransaction } from "./getTransaction";
import { buildWithdrawTransaction } from "./buildWithdrawTransaction";

export const SolanaTradingService: TradingIntegrationProviderService = {
    magicWalletType: WalletType.SOLANA,
    getDepositInfo: getDepositInfo,
    buildWithdrawTransaction: buildWithdrawTransaction,
    searchTokens: searchTokens,
    getPositionForToken: getPositionForToken,
    getTokenChart: getTokenChart,
    getToken: getToken,
    getPositions: getPositions,
    getTransactions: getTransactions,
    getTokenInfo: getTokenInfo,
    getTransaction: getTransaction,
    getTokenSecurity: getTokenSecurity,
};
