import {
    MagicWallet,
    WalletType,
    MagicUserMetadata,
    Magic,
} from "@magic-sdk/admin";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import {
    TradingIntegrationInfo,
    TradingIntegrationService,
} from "src/shared/integrations";
import {
    Position,
    TradingIntegrationProviderService,
    IntegrationTransaction,
} from "src/shared/integrations/types";
import { magic } from "src/utils/magic";

const _getWalletTransactionsForProvider =
    (issuer: string) =>
    async ({
        service,
    }: TradingIntegrationInfo): Promise<
        FailureOrSuccess<DefaultErrors, IntegrationTransaction[]>
    > => {
        const walletResponse = await magic.wallets.getPublicAddress(
            issuer,
            service.magicWalletType
        );

        if (walletResponse.isFailure()) {
            return failure(walletResponse.error);
        }

        const wallet = walletResponse.value;

        if (!wallet || !wallet.publicAddress) {
            return success([]);
        }

        return service.getTransactions(wallet.publicAddress);
    };

const _getTransactions = async (
    issuer: string
): Promise<FailureOrSuccess<DefaultErrors, IntegrationTransaction[]>> => {
    const supportedProviders =
        TradingIntegrationService.getAllSupportedTradingProviders();

    const allPositions = await Promise.all(
        supportedProviders.map(_getWalletTransactionsForProvider(issuer))
    );

    const failures = allPositions.filter((p) => p.isFailure());

    if (failures.length > 0) {
        return failure(failures[0].error);
    }

    const allPositionsFlattened = allPositions.flatMap((p) => p.value);

    return success(allPositionsFlattened);
};

const getTransactionsForMagicUser = async (
    issuer: string
): Promise<FailureOrSuccess<DefaultErrors, IntegrationTransaction[]>> => {
    const allPositionsResponses = await _getTransactions(issuer);

    if (allPositionsResponses.isFailure()) {
        return failure(allPositionsResponses.error);
    }

    const allPositions = allPositionsResponses.value;

    return success(allPositions);
};

export const TransactionsService = {
    getTransactionsForMagicUser,
};
