import { Maybe } from "src/core/logic";

export enum Country {
    US = "US",
    UK = "UK",
    CA = "CA",
    AU = "AU",
}

export enum AssetType {
    FungibleToken = "fungible_token",
    NFT = "nft",
    FiatCurrency = "fiat_currency",
}

export enum TradingProvider {
    Jupiter = "jupiter",
}

export enum WalletProvider {
    Phantom = "phantom",
    Awaken = "awaken",
}

export enum TradingSide {
    Buy = "buy",
    Sell = "sell",
}

export enum AccountProvider {
    Solana = "solana",
}

export enum CurrencyCode {
    USD = "USD",
}

export enum TransferType {
    Sent = "sent",
    Received = "received",
    Internal = "internal",
}

export enum TransactionType {
    Deposit = "deposit",
    Trade = "trade",
    Failed = "failed",
    Withdrawal = "withdrawal",
}

export enum TransactionStatus {
    Pending = "pending",
    Processed = "processed",
    Confirmed = "confirmed",
    Failed = "failed",
    Finalized = "finalized",
}

export enum SwapPrivacy {
    Public = "public",
    Following = "following",
    Private = "private",
}

export const DEFAULT_SWAP_PRIVACY = SwapPrivacy.Public;
