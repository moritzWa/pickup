import {
    DefaultErrors,
    FailureOrSuccess,
    NotFoundError,
    failure,
    success,
} from "src/core/logic";
import { magic } from "src/utils/magic";
import { WalletType } from "@magic-sdk/admin";
import { helius } from "src/utils";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { connect } from "src/core/infra/postgres";
import { DepositInfo, TradingIntegrationProviderService } from "../../types";

export const getDepositInfo: TradingIntegrationProviderService["getDepositInfo"] =
    async (issuer: string) => {
        const walletResponse = await magic.wallets.getPublicAddress(
            issuer,
            WalletType.SOLANA
        );

        if (walletResponse.isFailure()) {
            return failure(walletResponse.error);
        }

        const wallet = walletResponse.value;

        if (!wallet || !wallet.publicAddress) {
            return failure(new NotFoundError("Could not find the wallet."));
        }

        const balanceResponse = await helius.wallets.allBalances(
            wallet.publicAddress
        );

        if (balanceResponse.isFailure()) {
            return failure(balanceResponse.error);
        }

        const balance = balanceResponse.value;

        return success({
            publicAddress: wallet.publicAddress,
            nativeBalance: balance.nativeBalance,
            isFunded: false,
            provider: AccountProvider.Solana,
        });
    };

if (require.main === module) {
    connect()
        .then(async () => {
            const issuer =
                "did:ethr:0x3084180E9cDAAb20CC86505B711a0Eec94B80C9A";

            const publicAddress = await magic.wallets.getPublicAddress(
                issuer,
                WalletType.SOLANA
            );

            return getDepositInfo(issuer);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
