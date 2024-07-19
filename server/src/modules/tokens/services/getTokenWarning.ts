import { AccountProvider } from "src/core/infra/postgres/entities";
import { BlacklistReason } from "src/core/infra/postgres/entities/Token";
import { Maybe } from "src/core/logic";
import { SOL_USDC_MINT } from "src/shared/integrations/providers/solana/constants";
import { TokenOverviewData } from "src/shared/integrations/types";

export enum TokenWarningReason {
    Freezeable = "freezeable",
    Rugged = "rugged",
    Top10HolderPercent = "top10HolderPercent",
    Blacklisted = "blacklisted",
}

export enum TokenWarningSeverity {
    Low = "low",
    High = "high",
}

export type TokenWarningInfo = {
    reason: TokenWarningReason;
    severity: TokenWarningSeverity;
    message: string;
};

const RUGGED_TOKENS_LIST = [
    {
        provider: AccountProvider.Solana,
        contractAddress: "E6TaFQHpSC3LY3YahaYopx8FKwKDVEuDruaa3o4UTvGP",
    },
];

type GetTokenWarningParams = {
    contractAddress: string;
    provider: AccountProvider;
    freezeable: Maybe<boolean>;
    top10UserPercent: Maybe<number>;
    isBlacklisted: Maybe<BlacklistReason>;
};

const getTokenWarning = (
    params: GetTokenWarningParams
): Maybe<TokenWarningInfo> => {
    // allow this
    if (params.contractAddress === SOL_USDC_MINT) {
        return null;
    }

    if (
        RUGGED_TOKENS_LIST.filter(
            (t) =>
                t.provider === params.provider &&
                t.contractAddress === params.contractAddress
        ).length > 0
    )
        return {
            reason: TokenWarningReason.Rugged,
            severity: TokenWarningSeverity.High,
            message:
                "Movement has manually labeled this token as a scam. If you trade this token, you will likely lose all the money you put in.",
        };

    if (params.freezeable) {
        return {
            reason: TokenWarningReason.Freezeable,
            severity: TokenWarningSeverity.High,
            message:
                "This token is freezeable. This means that once you buy tokens, the creator can freeze them so you can't sell them.",
        };
    }

    if (params.top10UserPercent && params.top10UserPercent >= 0.8) {
        return {
            reason: TokenWarningReason.Top10HolderPercent,
            // don't make this high bc this factors in exchanges atm
            severity: TokenWarningSeverity.Low,
            message:
                "The top 10 holders of this coin own more than 80% of the supply. This is a dangerous sign, as it means that a few people can sell all their tokens and make the token price drop to $0.",
        };
    }

    if (params.isBlacklisted) {
        return {
            reason: TokenWarningReason.Blacklisted,
            severity: TokenWarningSeverity.High,
            message:
                "This token has been blacklisted: " +
                params.isBlacklisted.toString().replace("_", " "),
        };
    }

    return null;
};

export { getTokenWarning };
