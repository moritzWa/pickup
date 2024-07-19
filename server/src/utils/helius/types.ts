import { Maybe } from "src/core/logic";

export enum HeliusTransferType {
    UNKNOWN = "UNKNOWN",
    NFT_BID = "NFT_BID",
    NFT_BID_CANCELLED = "NFT_BID_CANCELLED",
    NFT_LISTING = "NFT_LISTING",
    NFT_CANCEL_LISTING = "NFT_CANCEL_LISTING",
    NFT_SALE = "NFT_SALE",
    NFT_MINT = "NFT_MINT",
    NFT_AUCTION_CREATED = "NFT_AUCTION_CREATED",
    NFT_AUCTION_UPDATED = "NFT_AUCTION_UPDATED",
    NFT_AUCTION_CANCELLED = "NFT_AUCTION_CANCELLED",
    NFT_PARTICIPATION_REWARD = "NFT_PARTICIPATION_REWARD",
    NFT_MINT_REJECTED = "NFT_MINT_REJECTED",
    CREATE_STORE = "CREATE_STORE",
    WHITELIST_CREATOR = "WHITELIST_CREATOR",
    ADD_TO_WHITELIST = "ADD_TO_WHITELIST",
    REMOVE_FROM_WHITELIST = "REMOVE_FROM_WHITELIST",
    AUCTION_MANAGER_CLAIM_BID = "AUCTION_MANAGER_CLAIM_BID",
    EMPTY_PAYMENT_ACCOUNT = "EMPTY_PAYMENT_ACCOUNT",
    UPDATE_PRIMARY_SALE_METADATA = "UPDATE_PRIMARY_SALE_METADATA",
    ADD_TOKEN_TO_VAULT = "ADD_TOKEN_TO_VAULT",
    ACTIVATE_VAULT = "ACTIVATE_VAULT",
    INIT_VAULT = "INIT_VAULT",
    INIT_BANK = "INIT_BANK",
    INIT_STAKE = "INIT_STAKE",
    MERGE_STAKE = "MERGE_STAKE",
    SPLIT_STAKE = "SPLIT_STAKE",
    SET_BANK_FLAGS = "SET_BANK_FLAGS",
    SET_VAULT_LOCK = "SET_VAULT_LOCK",
    UPDATE_VAULT_OWNER = "UPDATE_VAULT_OWNER",
    UPDATE_BANK_MANAGER = "UPDATE_BANK_MANAGER",
    RECORD_RARITY_POINTS = "RECORD_RARITY_POINTS",
    ADD_RARITIES_TO_BANK = "ADD_RARITIES_TO_BANK",
    INIT_FARM = "INIT_FARM",
    INIT_FARMER = "INIT_FARMER",
    REFRESH_FARMER = "REFRESH_FARMER",
    UPDATE_FARM = "UPDATE_FARM",
    AUTHORIZE_FUNDER = "AUTHORIZE_FUNDER",
    DEAUTHORIZE_FUNDER = "DEAUTHORIZE_FUNDER",
    FUND_REWARD = "FUND_REWARD",
    CANCEL_REWARD = "CANCEL_REWARD",
    LOCK_REWARD = "LOCK_REWARD",
    PAYOUT = "PAYOUT",
    VALIDATE_SAFETY_DEPOSIT_BOX_V2 = "VALIDATE_SAFETY_DEPOSIT_BOX_V2",
    SET_AUTHORITY = "SET_AUTHORITY",
    INIT_AUCTION_MANAGER_V2 = "INIT_AUCTION_MANAGER_V2",
    UPDATE_EXTERNAL_PRICE_ACCOUNT = "UPDATE_EXTERNAL_PRICE_ACCOUNT",
    AUCTION_HOUSE_CREATE = "AUCTION_HOUSE_CREATE",
    CLOSE_ESCROW_ACCOUNT = "CLOSE_ESCROW_ACCOUNT",
    WITHDRAW = "WITHDRAW",
    DEPOSIT = "DEPOSIT",
    TRANSFER = "TRANSFER",
    BURN = "BURN",
    BURN_NFT = "BURN_NFT",
    PLATFORM_FEE = "PLATFORM_FEE",
    LOAN = "LOAN",
    REPAY_LOAN = "REPAY_LOAN",
    ADD_TO_POOL = "ADD_TO_POOL",
    REMOVE_FROM_POOL = "REMOVE_FROM_POOL",
    CLOSE_POSITION = "CLOSE_POSITION",
    UNLABELED = "UNLABELED",
    CLOSE_ACCOUNT = "CLOSE_ACCOUNT",
    WITHDRAW_GEM = "WITHDRAW_GEM",
    DEPOSIT_GEM = "DEPOSIT_GEM",
    STAKE_TOKEN = "STAKE_TOKEN",
    UNSTAKE_TOKEN = "UNSTAKE_TOKEN",
    STAKE_SOL = "STAKE_SOL",
    UNSTAKE_SOL = "UNSTAKE_SOL",
    CLAIM_REWARDS = "CLAIM_REWARDS",
    BUY_SUBSCRIPTION = "BUY_SUBSCRIPTION",
    SWAP = "SWAP",
    INIT_SWAP = "INIT_SWAP",
    CANCEL_SWAP = "CANCEL_SWAP",
    REJECT_SWAP = "REJECT_SWAP",
    INITIALIZE_ACCOUNT = "INITIALIZE_ACCOUNT",
    TOKEN_MINT = "TOKEN_MINT",
    COMPRESSED_NFT_MINT = "COMPRESSED_NFT_MINT",
}

export enum HeliusTokenStandard {
    Fungible = "Fungible",
    NonFungible = "NonFungible",
    UnknownStandard = "UnknownStandard",
    ProgrammableNonFungible = "ProgrammableNonFungible",
    NonFungibleEdition = "NonFungibleEdition",
}

export type HeliusNativeTransfer = {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
};

export type HeliusTokenTransfer = {
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: HeliusTokenStandard;
};

export type TokenBalanceChange = {
    mint: Maybe<string>; // null = SOL
    rawTokenAmount: Maybe<{ decimals: number; tokenAmount: string }>;
    tokenAccount: string;
    userAccount: string; // may be empty string
};

export type HeliusAccountData = {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: TokenBalanceChange[];
};

export type HeliusTransactionNFTEvent = {
    description: string;
    type: HeliusTransferType;
    source: string;
    amount: number;
    fee: number;
    feePayer: string;
    signature: string;
    slot: number;
    timestamp: number;
    saleType: string;
    buyer: string;
    seller: string;
    staker: string;
    nfts: [
        {
            mint: string;
            tokenStandard: HeliusTokenStandard;
        }
    ];
};

export type HeliusTokenChange = {
    userAccount: string;
    tokenAccount: string;
    mint: string;
    rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
    };
};

export type HeliusTransactionSwapEventInnerSwap = {
    tokenInputs: HeliusTokenTransfer[];
    tokenOutputs: HeliusTokenTransfer[];
    tokenFees: HeliusTokenTransfer[];
    nativeFees: HeliusNativeTransfer[];
    programInfo: {
        source: string; // ex. ORCA
        account: string;
        programName: string;
        instructionName: string;
    };
};

export type HeliusTransactionSwapEvent = {
    nativeInput: {
        account: string;
        amount: string;
    };
    nativeOutput: {
        account: string;
        amount: string;
    };
    tokenInputs: HeliusTokenChange[];
    tokenOutputs: HeliusTokenChange[];
    tokenFees: HeliusTokenChange[];
    nativeFees: {
        account: string;
        amount: string;
    }[];
    innerSwaps: HeliusTransactionSwapEventInnerSwap[];
};

export type HeliusTransactionCompressionEvent = {
    assetId: string;
    innerInstructionIndex: number;
    instructionIndex: number;
    leadIndex: number;
    newLeafDelegate: string | null;
    newLeafOwner: string | null;
    oldLeadDelegate: string | null;
    oldLeafOwner: string | null;
    seq: number;
    treeDelegate: string | null;
    treeId: string;
    type: "COMPRESSED_NFT_TRANSFER";
};

export type HeliusTransactionInstruction = {
    programId: string;
    data: string;
    accounts: string[];
};

export type DestructuredHeliusTransactionInstruction = {
    programId: string;
    accountsLength: number;
    innerInstructions: { programId: string; accountsLength: number }[];
};

export type HeliusTransaction = {
    description: string;
    type: HeliusTransferType;
    source: string; // can be "SOLANA_PROGRAM_LIBRARY", "UNKNOWN" (custom programs), etc...
    fee: number; // fee in SOL (decimals 9 places)
    feePayer: string;
    signature: string;
    timestamp: number; // seconds
    nativeTransfers: HeliusNativeTransfer[];
    tokenTransfers: HeliusTokenTransfer[];
    instructions: (HeliusTransactionInstruction & {
        innerInstructions: HeliusTransactionInstruction[];
    })[];
    accountData: HeliusAccountData[];
    events?: {
        nft?: HeliusTransactionNFTEvent;
        swap?: HeliusTransactionSwapEvent;
        compressed?: HeliusTransactionCompressionEvent[];
    };
    transactionError?: any;
};

export type HeliusNFTMetadataCreator = {
    address: string;
    share: number;
    verified: boolean;
};

export type HeliusMetadataOnChainData = {
    collection: {
        key: string;
        verified: boolean;
    };
    // FIXME: this is prob gonna be a non null thing but right now it was always null as far as I can see
    collectionDetails: null;
    data: {
        creators: HeliusNFTMetadataCreator[];
        name: string;
        sellerFeeBasisPoints: number;
        symbol: string;
        uri: string;
    };
    editionNonce: number;
    isMutable: boolean;
    key: string;
    mint: string;
    primarySaleHappened: boolean;
    tokenStandard: "NonFungible";
    updateAuthority: string;
    uses: null;
};

export type HeliusMetadataOffChainData = {
    attributes: any[];
    collection: Maybe<{ family: string; name: string }>;
    collectionDetails: null;
    description: string;
    external_url: string;
    image: string;
    name: string;
};

export type HeliusNFTMetadata = {
    mint: string;
    onChainData: HeliusMetadataOnChainData;
    offChainData: HeliusMetadataOffChainData;
};

type MetaplexOnChainData = {
    key: string;
    mint: string;
    updateAuthority: string;
    data?: {
        name: Maybe<string>;
        symbol: Maybe<string>;
        uri: Maybe<string>;
        sellerFeeBasisPoints: Maybe<number>;
        creators: Maybe<string[]>;
    };
    tokenStandard: HeliusTokenStandard;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number;
    collection: unknown;
    collectionDetails: unknown;
    uses: number;
    error: any;
};

export type MetaplexOffChainMetadata = {
    name: Maybe<string>;
    symbol: Maybe<string>;
    attributes: any;
    sellerFeeBasisPoints: Maybe<number>;
    image: Maybe<string>;
    external_url: Maybe<string>;
    properties: any;
    collection?: Maybe<{ family: string; name: string }>;
};

export type HeliusTokenMetadataOnChainAccountInfo = {
    accountInfo: {
        key: string;
        isSigner: boolean;
        isWritable: boolean;
        lamports: number;
        data: {
            parsed: {
                info: {
                    decimals: number;
                    freezeAuthority: string;
                    isInitialized: boolean;
                    mintAuthority: string;
                    supply: string;
                };
                type: string;
            };
            program: string;
            space: number;
        };
        owner: string;
        executable: boolean;
        rentEpoch: number;
    };
};

export type HeliusLegacyMetadata = {
    chainId: number;
    address: string;
    symbol: Maybe<string>;
    name: Maybe<string>;
    decimals: Maybe<number>;
    logoURI: Maybe<string>;
    tags: any;
    extensions: any;
};

export type HeliusTokenMetadata = {
    account: string;
    onChainAccountInfo: HeliusTokenMetadataOnChainAccountInfo;
    onChainMetadata: {
        metadata: MetaplexOnChainData;
        uri: string;
    };
    offChainMetadata: {
        metadata: MetaplexOffChainMetadata;
        uri: string;
    };
    legacyMetadata: HeliusLegacyMetadata;
};

export type HeliusTokenDASMetadataContent = {
    $schema: string;
    json_uri: string;
    files: Array<{
        uri: string;
        cdn_uri: string;
        mime: string;
    }>;
    metadata: {
        attributes: Array<{
            value: string;
            trait_type: string;
        }>;
        description: string;
        name: string;
        symbol: string;
        token_standard: HeliusTokenStandard;
    };
    links: {
        external_url: string;
        image: string;
    };
};

export type HeliusTokenMintExtensions = {
    confidential_transfer_mint?: any;
    confidential_transfer_fee_config?: any;
    transfer_fee_config?: any;
    metadata_pointer?: any;
    mint_close_authority?: any;
    permanent_delegate?: any;
    transfer_hook?: any;
    interest_bearing_config?: any;
    default_account_state?: any;
    confidential_transfer_account?: any;
    metadata?: any;
};

export type HeliusTokenDASMetadata = {
    interface: "V1_NFT";
    id: string;
    content: HeliusTokenDASMetadataContent;
    authorities: Array<{
        address: string;
        scopes: string[];
    }>;
    compression?: {
        eligible: boolean;
        compressed: boolean;
        data_hash: string;
        creator_hash: string;
        asset_hash: string;
        tree: string;
        seq: number;
        leaf_id: number;
    };
    grouping: Array<{
        group_key: string;
        group_value: string;
        collection_metadata?: {
            name: string;
            symbol: string;
            image: string;
            external_url: string;
        };
    }>;
    royalty: {
        royalty_model: string;
        target: null | string;
        percent: number;
        basis_points: number;
        primary_sale_happened: boolean;
        locked: boolean;
    };
    creators: Array<{
        address: string;
        share: number;
        verified: boolean;
    }>;
    ownership: {
        frozen: boolean;
        delegated: boolean;
        delegate: null | string;
        ownership_model: string;
        owner: string;
    };
    supply: {
        print_max_supply: number;
        print_current_supply: number;
        edition_nonce: null | number;
    };
    mutable: boolean;
    burnt: boolean;
    token_info: {
        decimals: number;
        price_info?: { price_per_token: number; currency: string }; // ex. USDC
        supply: number;
        symbol: string;
        token_program: string;
    };
    mint_extensions?: HeliusTokenMintExtensions;
};

export type HeliusTokenBalance = {
    tokenAccount: string;
    mint: string;
    decimals: number;
    amount: number;
};

export type HeliusBalance = {
    nativeBalance: number; // not rounded with decimals
    tokenBalances: HeliusTokenBalance[];
};

export interface HeliusAssetBalance {
    interface: "FungibleAsset";
    id: string;
    content: Content;
    authorities: HeliusAuthority[];
    compression?: HeliusCompression;
    grouping: any[]; // Replace 'any' with a more specific type if available
    royalty: HeliusRoyalty;
    creators: HeliusCreator[];
    ownership: HeliusOwnership;
    supply: null; // Replace 'null' with a specific type if it can have other values
    mutable: boolean;
    burnt: boolean;
    token_info: HeliusTokenInfo;
}

interface Content {
    $schema: string;
    json_uri: string;
    files: HeliusFile[];
    metadata: HeliusMetadata;
    links: HeliusLinks;
}

interface HeliusFile {
    uri: string;
    cdn_uri: string;
    mime: string;
}

interface HeliusMetadata {
    attributes: HeliusAttribute[];
    description: string;
    name: string;
    symbol: string;
    token_standard: string;
}

interface HeliusAttribute {
    value: string;
    trait_type: string;
}

interface HeliusLinks {
    image: string;
    external_url: string;
}

interface HeliusAuthority {
    address: string;
    scopes: string[];
}

interface HeliusCompression {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
}

interface HeliusRoyalty {
    royalty_model: string;
    target: null; // Replace 'null' with a specific type if it can have other values
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
}

interface HeliusCreator {
    address: string;
    share: number;
    verified: boolean;
}

interface HeliusOwnership {
    frozen: boolean;
    delegated: boolean;
    delegate: null; // Replace 'null' with a specific type if it can have other values
    ownership_model: string;
    owner: string;
}

interface HeliusTokenInfo {
    balance: number;
    supply: number;
    decimals: number;
    token_program: string;
    associated_token_address: string;
    symbol?: string;
}

export enum PriorityLevel {
    NONE = "NONE", // 0th percentile
    LOW = "LOW", // 25th percentile
    MEDIUM = "MEDIUM", // 50th percentile
    HIGH = "HIGH", // 75th percentile
    VERY_HIGH = "VERY_HIGH", // 95th percentile
    // labelled unsafe to prevent people using and draining their funds by accident
    UNSAFE_MAX = "UNSAFE_MAX", // 100th percentile
    DEFAULT = "DEFAULT", // 50th percentile
}

export type HeliusPriorityFeeLevels = {
    min: 0.0;
    low: 2.0;
    medium: 10082.0;
    high: 100000.0;
    veryHigh: 1000000.0;
    unsafeMax: 50000000.0;
};
