import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import {
    Position,
    TradingIntegrationProviderService,
    IntegrationTransaction,
    TradingIntegrationTransfer,
} from "../../types";
import {
    HeliusTransaction,
    HeliusTransactionSwapEvent,
    HeliusTransferType,
    SolanaSigAndStatus,
    formatNum,
    getHeliusCDNUrl,
    helius,
} from "src/utils";
import BigNumber from "bignumber.js";
import { MagicUserMetadata, WalletType } from "@magic-sdk/admin";
import { connect } from "src/core/infra/postgres";
import {
    AccountProvider,
    TransactionStatus,
} from "src/core/infra/postgres/entities";
import { WRAPPED_SOL_MINT } from "./constants";
import { chunk, first, isNil, keyBy } from "lodash";
import { getSymbolForTransferType } from "../../utils";
import { parallel } from "radash";
import {
    TransactionType,
    TransferType,
} from "src/core/infra/postgres/entities";
import { buildTransfers } from "./utils";

const PROVIDER = AccountProvider.Solana;

export const getTransactions: TradingIntegrationProviderService["getTransactions"] =
    async (walletAddress: string) => {
        try {
            const transactionsResponse = await _getAllTransactions(
                walletAddress
            );

            if (transactionsResponse.isFailure()) {
                return failure(transactionsResponse.error);
            }

            // almost always spam txns
            const filteredTxns = transactionsResponse.value.filter(
                (t) => t.type !== HeliusTransferType.COMPRESSED_NFT_MINT
            );

            const transactions = filteredTxns.map(
                (t): IntegrationTransaction => {
                    const { transfers, type } = buildTransfers(
                        walletAddress,
                        t
                    );

                    return {
                        hash: t.signature,
                        // if err -> failed. otherwise finalized bc helius doesn't return unless finalized
                        status: !isNil(t.transactionError)
                            ? TransactionStatus.Failed
                            : TransactionStatus.Finalized,
                        description: "",
                        type: type,
                        provider: PROVIDER,
                        blockExplorerUrl: `https://solscan.io/tx/${t.signature}`,
                        transfers: transfers,
                        feePaidAmount: new BigNumber(t.fee).div(
                            new BigNumber(10).pow(9)
                        ),
                        createdAt: new Date(t.timestamp * 1_000),
                    };
                }
            );

            const relevantTransactions = transactions.filter(
                (t) => t.transfers.length > 0
            );

            // we then need to lookup the data
            const tokenContractAddresses = new Set(
                relevantTransactions.flatMap((t) =>
                    t.transfers.map((t) => t.contractAddress)
                )
            );

            const metadataResponse = await helius.tokens.metadataDAS(
                Array.from(tokenContractAddresses)
            );

            if (metadataResponse.isFailure()) {
                return failure(metadataResponse.error);
            }

            const metadataByContract = keyBy(
                metadataResponse.value,
                (v) => v.id
            );

            const decoratedTxns = relevantTransactions.map((t) => {
                const decoratedTransfers = t.transfers.map(
                    (tr): TradingIntegrationTransfer => {
                        const metadata = metadataByContract[tr.contractAddress];

                        return {
                            type: tr.type,
                            amount: tr.amount,
                            from: tr.from,
                            to: tr.to,
                            contractAddress: tr.contractAddress,
                            decimals:
                                tr.decimals ?? metadata?.token_info?.decimals,
                            provider: PROVIDER,
                            iconImageUrl:
                                getHeliusCDNUrl(metadata) ||
                                metadata?.content.links.image ||
                                null,
                            symbol: metadata?.token_info?.symbol || "",
                        };
                    }
                );

                const description = decoratedTransfers
                    .map((t) => {
                        return `${getSymbolForTransferType(t.type)}${formatNum(
                            t.amount.toNumber()
                        )} ${t.symbol}`;
                    })
                    .join(" | ");

                return {
                    ...t,
                    description,
                    transfers: decoratedTransfers,
                };
            });

            return success(decoratedTxns);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
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

if (require.main === module) {
    connect()
        .then(async () => {
            await getTransactions(
                "GWaxhgByJRYwQUrj3LzG1L1LzNm5cqB227WqzNLQBzLK"
            );
            // const magic = await getMagic();
            // const user = await magic.users.getMetadataByIssuerAndWallet(
            //     "did:ethr:0xa6A9926ccA8818a3C88C729C017Cd70685105C64",
            //     WalletType.SOLANA
            // );
            // const solanaWallet = user.wallets?.find(
            //     (w: any) =>
            //         w.wallet_type === WalletType.SOLANA ||
            //         w.walletType === WalletType.SOLANA
            // ) as any;
            // const walletAddress =
            //     solanaWallet.publicAddress || solanaWallet.public_address;
            // // const user = await magic.
            // return SolanaPositionService.getPositions(
            //     "79GZRSLYTgPka6NTQ3H2Xj68Pq7smmpghk6NDPnvhqX7",
            //     user
            // );
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
