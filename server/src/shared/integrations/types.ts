import {
    AccountProvider,
    TransferType,
    TransactionType,
    TransactionStatus,
    User,
    TradingSide,
} from "src/core/infra/postgres/entities";
import BigNumber from "bignumber.js";
import { DefaultErrors, FailureOrSuccess, Maybe } from "src/core/logic";
import { ChartType, CurrencyCode } from "../domain";
import { WalletType } from "@magic-sdk/admin";
import {
    Category,
    CategoryEntry,
    MemecoinLink,
} from "src/core/infra/postgres/entities/Token";
import { TokenWarningInfo } from "src/modules/tokens/services/getTokenWarning";

export type DepositInfo = {
    publicAddress: string;
    nativeBalance: BigNumber;
    isFunded: boolean;
    provider: AccountProvider;
};

export type Position = {
    isNativeToken: boolean;
    iconImageUrl: Maybe<string>;
    symbol: Maybe<string>;
    amount: BigNumber;
    contractAddress: string;
    provider: AccountProvider;
    coingeckoTokenId: Maybe<string>;
    canSelectToken: boolean;
};

export type FullPosition = {
    isNativeToken: boolean;
    iconImageUrl: Maybe<string>;
    symbol: Maybe<string>;
    amount: BigNumber;
    contractAddress: string;
    provider: AccountProvider;
    coingeckoTokenId: Maybe<string>;
    priceCents: Maybe<BigNumber>;
    totalFiatAmountCents: Maybe<BigNumber>;
    fiatCurrency: CurrencyCode;
    dailyChangePercentage: Maybe<BigNumber>;
    dailyChangePerUnitCents: Maybe<BigNumber>;
    dailyFiatAmountCents: Maybe<BigNumber>;
    dailyPercentageFormatted: Maybe<string>;
    canSelectToken: boolean;
};

export type ChartPoint = {
    valueCents: number;
    timestamp: Date;
};

export type Token = {
    symbol: string;
    name: string;
    iconImageUrl: string;
    contractAddress: string;
    decimals: number;
    coingeckoTokenId: Maybe<string>;
    provider: AccountProvider;
    chartProvider: "trading_service" | "coingecko";
    recommendedSlippageBps: Maybe<number>;
    tokenId: Maybe<string>; // in our db
    isStrict?: Maybe<boolean>;
    isClaimed?: Maybe<boolean>;
    isMovementVerified?: Maybe<boolean>;
    createdAt: Maybe<Date>;
};

export type TokenSearchResult = {
    symbol: string;
    name: string;
    iconImageUrl: string;
    contractAddress: string;
    coingeckoTokenId: Maybe<string>;
    provider: AccountProvider;
};

export type TradingIntegrationTransfer = {
    type: TransferType;
    amount: BigNumber;
    from: Maybe<string>;
    to: Maybe<string>;
    // token info
    symbol: Maybe<string>;
    iconImageUrl: Maybe<string>;
    decimals: Maybe<number>;
    provider: AccountProvider;
    contractAddress: string;
};

export type IntegrationTransaction = {
    hash: string;
    type: TransactionType;
    status: TransactionStatus;
    provider: AccountProvider;
    description: Maybe<string>;
    blockExplorerUrl: string;
    transfers: TradingIntegrationTransfer[];
    feePaidAmount: BigNumber;
    createdAt: Date;
};

export type TokenPosition = {
    isNativeToken: boolean;
    iconImageUrl: Maybe<string>;
    symbol: Maybe<string>;
    amount: BigNumber;
    priceCents: BigNumber;
    fiatAmountCents: BigNumber;
    fiatCurrency: string; // currency for price + fiat amount
    contractAddress: string;
    provider: AccountProvider;
    coingeckoTokenId: Maybe<string>;
};

export type TokenSecurityData = {
    // data: {
    creatorAddress: string | null;
    ownerAddress: string | null;
    creationTx: string | null;
    creationTime: string | null;
    creationSlot: string | null;
    mintTx: string | null;
    mintTime: string | null;
    mintSlot: string | null;
    creatorBalance: number | null;
    ownerBalance: number | null;
    ownerPercentage: number | null;
    creatorPercentage: number | null;
    metaplexUpdateAuthority: string;
    metaplexUpdateAuthorityBalance: number;
    metaplexUpdateAuthorityPercent: number;
    mutableMetadata: boolean;
    top10HolderBalance: number;
    top10HolderPercent: number;
    top10UserBalance: number;
    top10UserPercent: number;
    isTrueToken: boolean | null;
    totalSupply: number;
    preMarketHolder: any[]; // Replace 'any' with a more specific type if possible
    lockInfo: any | null; // Replace 'any' with a more specific type if possible
    freezeable: boolean | null;
    freezeAuthority: string | null;
    transferFeeEnable: boolean | null;
    transferFeeData: any | null; // Replace 'any' with a more specific type if possible
    isToken2022: boolean;
    nonTransferable: boolean | null;
    // };
    // success: boolean;
    // statusCode: number;
};

export type TokenOverviewData = {
    provider: AccountProvider;
    address: string;
    bestLpPoolAddress: string | null;
    about: {
        description: string | null;
        address: string;
        links: {
            website: string | null;
            telegram: string | null;
            twitter: string | null;
            dexscreener: string | null;
            coingecko: string | null; // deprecate
            discord: string | null; // deprecate
            medium: string | null; // deprecate
        };
        moreLinks: MemecoinLink[];
        categories: CategoryEntry[];
        bannerUrl: string | null;
        holder: number | null;
        numMentions: number | null;
        isClaimed: boolean;
        irlName: string | null;
    };
    stats: {
        v24hUSD: Maybe<number>;
        marketCap: Maybe<number>;
        liquidity: Maybe<number>;
        trades24h: Maybe<number>;
        sells24h: Maybe<number>;
        buys24h: Maybe<number>;
        traders24h: Maybe<number>;
        isLiquidityLocked: boolean | null;
    };
    security: {
        creationTime: string | null;
        mintTime: string | null;
        freezeable: boolean | null;
        top10HolderPercent: number | null;
        top10UserPercent: number | null;
        showTop10: boolean;
        warning: Maybe<TokenWarningInfo>;
    };
};

export type WithdrawalTransactionResponse = FailureOrSuccess<
    DefaultErrors,
    {
        txn: string;
        solanaLastValidBlockHeight: number;
        solanaBlockhash: string;
    }
>;

export type TradingPositionInfo = {
    positions: Position[];
    publicKey: string;
    provider: AccountProvider;
};

export type TradingIntegrationProviderService = {
    magicWalletType: WalletType;
    getPositions: (
        walletAddress: string
    ) => Promise<FailureOrSuccess<DefaultErrors, TradingPositionInfo>>;
    getPositionForToken: (params: {
        token: Token;
        walletAddress: string;
    }) => Promise<FailureOrSuccess<DefaultErrors, TokenPosition>>;
    getTransactions: (
        walletAddress: string
    ) => Promise<FailureOrSuccess<DefaultErrors, IntegrationTransaction[]>>;
    getTransaction: ({
        hash,
        walletAddress,
    }: {
        hash: string;
        walletAddress: string; // the relevant wallet address we care about
    }) => Promise<FailureOrSuccess<DefaultErrors, IntegrationTransaction>>;
    buildWithdrawTransaction: ({
        contractAddress,
        isNativeToken,
        amount,
        toWalletAddress,
        fromWalletAddress,
    }: {
        contractAddress: string;
        isNativeToken: boolean;
        amount: BigNumber;
        toWalletAddress: string;
        fromWalletAddress: string;
    }) => Promise<WithdrawalTransactionResponse>;
    getDepositInfo: (
        issuer: string
    ) => Promise<FailureOrSuccess<DefaultErrors, DepositInfo>>;
    getToken: (params: {
        contractAddress: string;
    }) => Promise<FailureOrSuccess<DefaultErrors, Token>>;
    searchTokens: (params: {
        search?: string | null;
        side?: TradingSide;
        user: User | null;
    }) => Promise<
        FailureOrSuccess<
            DefaultErrors,
            {
                results: TokenSearchResult[];
                recommended: Maybe<TokenSearchResult>;
            }
        >
    >;
    getTokenChart: (params: {
        contractAddress: string;
        chartType: ChartType;
    }) => Promise<FailureOrSuccess<DefaultErrors, { points: ChartPoint[] }>>;
    getTokenInfo: (
        contractAddress: string
    ) => Promise<FailureOrSuccess<DefaultErrors, TokenOverviewData>>;
    getTokenSecurity: (
        contractAddress: string
    ) => Promise<FailureOrSuccess<DefaultErrors, TokenSecurityData>>;
};
