import { PublicKey } from "@solana/web3.js";
import {
    HeliusTokenChange,
    HeliusTransaction,
    HeliusTransactionSwapEvent,
    helius,
} from "src/utils";
import { TradingIntegrationTransfer } from "../../types";
import {
    AccountProvider,
    TransactionType,
    TransferType,
} from "src/core/infra/postgres/entities";
import BigNumber from "bignumber.js";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { parallel } from "radash";
import { chunk, isNil } from "lodash";
import { WRAPPED_SOL_MINT } from "./constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const PROVIDER = AccountProvider.Solana;

export const isValidSolanaAddress = async (
    address: string
): Promise<boolean> => {
    try {
        const isOnCurve = PublicKey.isOnCurve(address);
        if (isOnCurve) return true;

        if (address.length < 36) {
            return false;
        }
        // try to see if it's a mint account
        const mintAccount = await helius.accounts.getInfo(address);

        if (mintAccount.isSuccess() && mintAccount.value) {
            return true;
        }

        return false;
    } catch (err) {
        return false;
    }
};

export const isValidSolanaTokenAddress = (address: string): boolean => {
    try {
        return PublicKey.isOnCurve(address);
    } catch (err) {
        return false;
    }
};

export const buildTransfers = (
    walletAddress: string,
    t: HeliusTransaction
): { transfers: TradingIntegrationTransfer[]; type: TransactionType } => {
    const swapEvent = t.events?.swap;

    if (
        t.signature ===
        "4vjZMeqgFX6He7LEko84ZxRC6nbjcYo9Yw1bXdNSZRDvLYWQR1BW8q9jhCunorkv4jKjHvZyJG5uFq6hjntBVuCX"
    ) {
        debugger;
    }

    // if error, do not make the transfers for the transaction
    if (!isNil(t.transactionError)) {
        return {
            transfers: [],
            type: TransactionType.Failed,
        };
    }

    // if a swap event, parse it in a special way
    if (swapEvent) {
        return _parseSwapToken(swapEvent);
    }

    // native deposit / withdrawals
    const native = t.nativeTransfers.map((nt): TradingIntegrationTransfer => {
        const isSent = nt.fromUserAccount === walletAddress;

        return {
            symbol: null,
            iconImageUrl: null,
            type: isSent ? TransferType.Sent : TransferType.Received,
            amount: new BigNumber(nt.amount).div(new BigNumber(10).pow(9)),
            provider: PROVIDER,
            from: nt.fromUserAccount,
            to: nt.toUserAccount,
            contractAddress: WRAPPED_SOL_MINT,
            decimals: 9,
        };
    });

    // make a list of from, to, contract and amount
    // be we need to filter out token transfers that may be "duplicates"
    // where you have SOL you are spending but under the hood it is being wrapped
    const nativeKeys = new Set(
        native.map(
            (n) =>
                `${n.from || ""}:${n.to || ""}:${
                    n.contractAddress
                }:${n.amount.toString()}`
        )
    );

    const tokenTransfers = t.tokenTransfers
        .filter((tt) => {
            // if the from user + from token is the same as the native transfer,
            // it means they were actually just transferring it to an account they own, so we don't need to include it again
            const fromKey = `${tt.fromUserAccount}:${tt.fromTokenAccount}:${tt.mint}:${tt.tokenAmount}`;
            const fromExists = nativeKeys.has(fromKey);
            if (fromExists) return false;
            return true;
        })
        .map((tt): TradingIntegrationTransfer => {
            const isSent = tt.fromUserAccount === walletAddress;

            return {
                symbol: null,
                iconImageUrl: null,
                type: isSent ? TransferType.Sent : TransferType.Received,
                amount: new BigNumber(tt.tokenAmount),
                provider: PROVIDER,
                from: tt.fromUserAccount,
                to: tt.toUserAccount,
                contractAddress: tt.mint,
                decimals: null,
            };
        });

    const allTransfers = [...native, ...tokenTransfers];
    const transfers = allTransfers.filter(
        _shouldIncludeTransfer(walletAddress, allTransfers)
    );

    const allAreTo = transfers.every((t) => t.type === TransferType.Received);
    const allAreFrom = transfers.every((t) => t.type === TransferType.Sent);

    return {
        transfers: transfers,
        type: allAreTo
            ? TransactionType.Deposit
            : allAreFrom
            ? TransactionType.Withdrawal
            : TransactionType.Trade,
    };
};

const _shouldIncludeTransfer =
    (walletAddress: string, allTransfers: TradingIntegrationTransfer[]) =>
    (t: TradingIntegrationTransfer) => {
        if (t.amount.eq(0)) return false;

        if (t.from !== walletAddress && t.to !== walletAddress) return false;

        if (
            (t.symbol === "SOL" || t.contractAddress === WRAPPED_SOL_MINT) &&
            t.amount.lte(0.003) &&
            t.amount.gte(0.002)
        )
            return false;

        // handle USDC fees?
        // const usdcTransfers = allTransfers.filter(t => t.symbol === "USDC");
        // const smallestUSDCTransfer = usdcTransfers.reduce((acc, t) => t.amount.lt(acc.amount) ? t : acc, {amount: new BigNumber(100

        return true;
    };

const _parseSwapToken = (
    swapEvent: HeliusTransactionSwapEvent
): { transfers: TradingIntegrationTransfer[]; type: TransactionType } => {
    const nativeInput = swapEvent.nativeInput;
    const nativeOutput = swapEvent.nativeOutput;
    const tokenInputs = swapEvent.tokenInputs;
    const tokenOutputs = swapEvent.tokenOutputs;

    // ex. '4vjZMeqgFX6He7LEko84ZxRC6nbjcYo9Yw1bXdNSZRDvLYWQR1BW8q9jhCunorkv4jKjHvZyJG5uFq6hjntBVuCX'
    if (
        !!nativeOutput &&
        !tokenInputs.length &&
        !tokenOutputs.length &&
        swapEvent.innerSwaps.length === 1
    ) {
        const tokenInputs = swapEvent.innerSwaps[0].tokenInputs;
        const tokenOutputs = swapEvent.innerSwaps[0].tokenOutputs;

        if (!tokenInputs.length || !tokenOutputs.length) {
            return {
                transfers: [],
                type: TransactionType.Failed,
            };
        }

        const formattedOutputs = tokenOutputs.map((to) => ({
            symbol: null,
            iconImageUrl: null,
            type: TransferType.Received,
            amount: new BigNumber(to.tokenAmount),
            decimals: null,
            from: null,
            to: to.toUserAccount,
            contractAddress: to.mint,
            provider: PROVIDER,
        }));

        const formattedInputs = tokenInputs.map((ti) => ({
            symbol: null,
            iconImageUrl: null,
            type: TransferType.Sent,
            amount: new BigNumber(ti.tokenAmount),
            decimals: null,
            from: ti.fromUserAccount,
            to: null,
            contractAddress: ti.mint,
            provider: PROVIDER,
        }));

        return {
            transfers: [...formattedInputs, ...formattedOutputs],
            type: TransactionType.Trade,
        };
    }

    // the user RECEIVED these
    const formattedOutputs = tokenOutputs.map(_toReceived);

    const formattedInputs = tokenInputs.map(_toSent);

    const formattedNativeInput = nativeInput
        ? {
              type: TransferType.Sent,
              amount: new BigNumber(nativeInput.amount).div(
                  new BigNumber(10).pow(9)
              ),
              symbol: "SOL",
              iconImageUrl: "https://assets.awaken.tax/icons/solana.png",
              decimals: 9,
              from: nativeInput.account,
              to: null,
              contractAddress: WRAPPED_SOL_MINT,
              provider: PROVIDER,
          }
        : null;

    const formattedNativeOutput = nativeOutput
        ? {
              type: TransferType.Received,
              amount: new BigNumber(nativeOutput.amount).div(
                  new BigNumber(10).pow(9)
              ),
              symbol: "SOL",
              iconImageUrl: "https://assets.awaken.tax/icons/solana.png",
              decimals: 9,
              from: null,
              to: nativeOutput.account,
              contractAddress: WRAPPED_SOL_MINT,
              provider: PROVIDER,
          }
        : null;

    const transfers = [
        ...formattedInputs,
        ...formattedOutputs,
        formattedNativeInput,
        formattedNativeOutput,
    ].filter(hasValue);

    return {
        transfers: transfers,
        type: TransactionType.Trade,
    };
};

const _toReceived = (to: HeliusTokenChange): TradingIntegrationTransfer => {
    return {
        symbol: null,
        iconImageUrl: null,
        type: TransferType.Received,
        amount: new BigNumber(to.rawTokenAmount.tokenAmount).div(
            new BigNumber(10).pow(to.rawTokenAmount.decimals)
        ),
        decimals: to.rawTokenAmount.decimals,
        from: null,
        to: to.userAccount,
        contractAddress: to.mint,
        provider: PROVIDER,
    };
};

const _toSent = (ti: HeliusTokenChange): TradingIntegrationTransfer => {
    return {
        symbol: null,
        iconImageUrl: null,
        type: TransferType.Sent,
        amount: new BigNumber(ti.rawTokenAmount.tokenAmount).div(
            new BigNumber(10).pow(ti.rawTokenAmount.decimals)
        ),
        decimals: ti.rawTokenAmount.decimals,
        from: ti.userAccount,
        to: null,
        contractAddress: ti.mint,
        provider: PROVIDER,
    };
};

const _getAllTransactions = async (
    walletAddress: string
): Promise<FailureOrSuccess<DefaultErrors, HeliusTransaction[]>> => {
    // get all the live token accounts for a user
    const liveTokenAccountsResponse =
        await helius.accounts.getLiveTokenAccountsForAddress(walletAddress);

    if (liveTokenAccountsResponse.isFailure()) {
        return failure(liveTokenAccountsResponse.error);
    }

    const tokenAccounts = liveTokenAccountsResponse.value;
    const addresses = [
        walletAddress,
        ...tokenAccounts.map((t) => t.tokenAccountAddress),
    ];

    // console.time("solanaV2GetAllSignatures-" + walletAddress);
    const allSignaturesResponse = await parallel(
        100,
        addresses,
        async (tokenAccountAddress) =>
            helius.accounts.getAllSignatures(tokenAccountAddress, null)
    );

    // console.timeEnd("solanaV2GetAllSignatures-" + walletAddress);

    const failures = allSignaturesResponse.filter((r) => r.isFailure());

    if (failures.length > 0) {
        return failure(
            new UnexpectedError(
                "Failed to get all signatures for token addresses",
                { failures }
            )
        );
    }

    const signatures = allSignaturesResponse
        .flatMap((r) => r.value)
        .filter((s) => isNil(s.err))
        .map((s) => s.signature);

    const chunks = chunk(signatures, 100);

    const allTxnsResponses = await parallel(5, chunks, async (chunk) =>
        helius.transactions.forSignatures(chunk)
    );

    const failureTxns = allTxnsResponses.filter((r) => r.isFailure());

    if (failureTxns.length > 0) {
        return failure(
            new UnexpectedError(
                "Failed to get all transactions for signatures",
                { failureTxns }
            )
        );
    }

    const allTxns = allTxnsResponses.flatMap((r) => r.value);

    return success(allTxns);
};
