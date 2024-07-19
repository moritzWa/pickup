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

export const getTokenChart: TradingIntegrationProviderService["getTokenChart"] =
    async ({ contractAddress }) => {
        // TODO: implement this. some tokens without coingecko we just don't have pricing data for atm
        return success({
            points: [],
        });
    };

if (require.main === module) {
    connect()
        .then(async () => {
            // const issuer =
            //     "did:ethr:0x3084180E9cDAAb20CC86505B711a0Eec94B80C9A";
            // const publicAddress = await magic.wallets.getPublicAddress(
            //     issuer,
            //     WalletType.SOLANA
            // );
            // return getDepositInfo(issuer);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
