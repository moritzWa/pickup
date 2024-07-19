import {
    MagicWallet,
    WalletType,
    MagicUserMetadata,
    Magic,
} from "@magic-sdk/admin";
import { keyBy } from "lodash";
import { AccountProvider } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { tokenRepo } from "src/modules/trading/infra/postgres";
import {
    TradingIntegrationInfo,
    TradingIntegrationService,
} from "src/shared/integrations";
import {
    Position,
    TradingIntegrationProviderService,
} from "src/shared/integrations/types";
import { magic } from "src/utils/magic";
import { In } from "typeorm";

type WalletPositions = {
    positions: Position[];
    publicKey: string;
    provider: AccountProvider;
};

const _getWalletPositionForProvider =
    (issuer: string) =>
    async ({
        service,
    }: TradingIntegrationInfo): Promise<
        FailureOrSuccess<DefaultErrors, Maybe<WalletPositions>>
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
            return success(null);
        }

        return service.getPositions(wallet.publicAddress);
    };

const _getPositions = async (
    issuer: string
): Promise<FailureOrSuccess<DefaultErrors, WalletPositions[]>> => {
    if (!issuer) {
        return failure(new Error("No issuer"));
    }

    const supportedProviders =
        TradingIntegrationService.getAllSupportedTradingProviders();

    const allPositions = await Promise.all(
        supportedProviders.map(_getWalletPositionForProvider(issuer))
    );

    const failures = allPositions.filter((p) => p.isFailure());

    if (failures.length > 0) {
        return failure(failures[0].error);
    }

    const allPositionsFlattened = allPositions
        .flatMap((p) => p.value)
        .filter(hasValue);

    return success(allPositionsFlattened);
};

// Note: no matter what this code returns back the initial positions
// so if it errors that is okay
const _hydrateForWallet = async (
    w: WalletPositions
): Promise<WalletPositions> => {
    try {
        const positions = w.positions;

        const tokensWithoutInfo = positions
            .filter((a) => !a.symbol || !a.iconImageUrl)
            .map((a) => ({
                provider: a.provider,
                contractAddress: a.contractAddress,
            }));

        // console.log(
        //     `[fetching metadata for ${tokensWithoutInfo.length} without info]`
        // );

        const metadataResponse = await TokenMetadataService.getTokenMetadatas(
            tokensWithoutInfo
        );

        if (metadataResponse.isFailure()) {
            return w;
        }

        const metadatas = metadataResponse.value ?? [];

        const metadatasByKey = keyBy(metadatas, (m) =>
            TokenService.buildKey(m.provider, m.contractAddress)
        );

        const newPositions = positions.map((p) => {
            const metadata =
                metadatasByKey[
                    TokenService.buildKey(p.provider, p.contractAddress)
                ];

            // if metadata, override those values
            if (metadata) {
                // console.log(`[hydrating for ${metadata.symbol}]`);
                p.symbol = metadata.symbol || p.symbol;
                p.iconImageUrl = metadata.iconImageUrl || p.iconImageUrl;
            }

            return p;
        });

        return {
            provider: w.provider,
            publicKey: w.publicKey,
            positions: newPositions,
        };
    } catch (err) {
        return w;
    }
};

const getPositionsForMagicUser = async (
    issuer: string
): Promise<FailureOrSuccess<DefaultErrors, WalletPositions[]>> => {
    const allPositionsResponses = await _getPositions(issuer);

    if (allPositionsResponses.isFailure()) {
        return failure(allPositionsResponses.error);
    }

    const allPositions = await Promise.all(
        allPositionsResponses.value.map(_hydrateForWallet)
    );

    return success(allPositions);
};

export const PositionService = {
    getPositionsForMagicUser,
};
