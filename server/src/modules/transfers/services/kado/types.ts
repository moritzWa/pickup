type ProcessingFee = {
    amount: number;
    unit: string;
    name: string;
    originalAmount: number;
    promotionModifier: number;
};

type BridgeFee = {
    amount: number;
    name: string;
    unit: string;
    discount: null | any;
    createdAt: string;
    updatedAt: string;
};

type Quote = {
    amount: number;
    price: number;
    symbol: string;
    unit: string;
};

type CryptoCurrency = {
    usesOsmoRouter: boolean;
    usesLifiRouter: boolean;
    usesAvaxRouter: boolean;
    usesSolanaRouter: boolean;
    usesPolygonFulfillment: boolean;
    usesAxelarBridge: boolean;
    usesInjectiveRouter: boolean;
    supportedOperations: any[];
    logoURI: string;
    fallbackAddress: string;
    fallbackAddressCoinType: number;
    rpcUrl: string;
    osmoPfmChannel: null | any;
    osmoPfmReceiver: string;
    enableMemo: boolean;
    isSupportedInBridgeWithSepa: boolean;
    _id: string;
    name: string;
    description: string;
    label: string;
    supportedProviders: string[];
    stablecoin: boolean;
    liveOnRamp: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    priority: number;
    symbol: string;
    fortressSymbol: string;
    fortressChainId: string;
    coingeckoId: string;
    address: string;
    blockExplorerURI: string;
    decimals: number;
    officialChainId: string;
    precision: number;
    rampProducts: string[];
    wallets: string[];
    canBeUsedForLiquidityFulfillment: boolean;
    isNative: boolean;
    avgOffRampTimeInSeconds: number;
    avgOnRampTimeInSeconds: number;
    canBeUsedWithFireblocks: boolean;
    fireblocksAssetId: string;
    bridgeCurrency: string;
    bridgePaymentRail: string;
    isSupportedInBridge: boolean;
    payLiquidationAddress: string;
    rpcURI: string;
};

type Chain = {
    _id: string;
    supportedEnvironment: string;
    network: string;
    origin: string;
    label: string;
    associatedAssets: string[];
    avgTransactionTimeSeconds: number;
    usesAvaxRouter: boolean;
    liveOnRamp: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    priority: number;
    ecosystem: string;
    officialId: string;
};

export type OrderData = {
    to: string;
    from: string;
    exchangeRate: number;
    currencyType: string;
    walletAddress: string;
    depositAddress: string;
    sendFrom: string;
    sendTo: string;
    processingFee: ProcessingFee;
    bridgeFee: BridgeFee[];
    smartContractFees: any[];
    gasFee: null | any;
    asset: string;
    assetSymbol: string;
    blockchain: string;
    txHash: string;
    humanStatusField: string;
    machineStatusField: string;
    providerDisbursementStatus: string;
    manualDepositWalletAddress: string;
    manualDepositMemo: null | any;
    createdAt: string;
    paymentStatus: null | any;
    transferStatus: string;
    allPossibleTxHashes: Record<string, any>;
    method: string;
    orderType: string;
    id: string;
    quote: Quote;
    originOfOrder: string;
    userRef: string;
    anchorTransactionId: string;
    payAmount: {
        amount: number;
        unit: string;
    };
    recvAmount: {
        unit: string;
    };
    totalFee: {
        amount: number;
        unit: string;
    };
    cryptoCurrency: CryptoCurrency;
    chain: Chain;
    settlementTimeInSeconds: number;
};

export type GetOrderApiResponse = {
    success: boolean;
    message: string;
    data: OrderData;
};
