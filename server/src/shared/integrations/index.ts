import { AccountProvider } from "src/core/infra/postgres/entities";
import { SolanaTradingService } from "./providers/solana";
import { TradingIntegrationProviderService } from "./types";
import { keyBy } from "lodash";
import {
    DefaultErrors,
    FailureOrSuccess,
    NotImplementError,
    failure,
    success,
} from "src/core/logic";

export type TradingIntegrationInfo = {
    provider: AccountProvider;
    service: TradingIntegrationProviderService;
};

const TRADING_INTEGRATIONS: TradingIntegrationInfo[] = [
    {
        provider: AccountProvider.Solana,
        service: SolanaTradingService,
    },
];

const INTEGRATION_BY_PROVIDER = keyBy(TRADING_INTEGRATIONS, (i) => i.provider);

const getIntegration = (
    provider: AccountProvider
): FailureOrSuccess<DefaultErrors, TradingIntegrationProviderService> => {
    if (!provider) {
        return failure(new Error("Provider is required"));
    }

    const info = INTEGRATION_BY_PROVIDER[provider];

    if (!info) {
        return failure(new NotImplementError(new Error("Not implemented")));
    }

    return success(info.service);
};

const getAllSupportedTradingProviders = (): TradingIntegrationInfo[] => {
    return TRADING_INTEGRATIONS;
};

export const TradingIntegrationService = {
    getIntegration: getIntegration,
    getAllSupportedTradingProviders,
};
