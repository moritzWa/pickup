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
import { connection } from "src/utils/helius/constants";

const PROVIDER = AccountProvider.Solana;

export const getTransaction: TradingIntegrationProviderService["getTransaction"] =
    async ({ hash, walletAddress }) => {
        try {
            const transactionResponse =
                await helius.transactions.findBySignature(hash);

            if (transactionResponse.isFailure()) {
                return failure(transactionResponse.error);
            }

            const txn = transactionResponse.value;

            const statusInfoResponse = await helius.transactions.getStatus(
                connection,
                hash
            );

            if (statusInfoResponse.isFailure()) {
                return failure(statusInfoResponse.error);
            }

            const status = statusInfoResponse.value?.status;

            const { transfers, type } = buildTransfers(walletAddress, txn);

            const transaction: IntegrationTransaction = {
                hash: txn.signature,
                description: "",
                status: status ?? TransactionStatus.Pending,
                type: type,
                provider: PROVIDER,
                blockExplorerUrl: `https://solscan.io/tx/${txn.signature}`,
                transfers: transfers,
                feePaidAmount: new BigNumber(txn.fee).div(
                    new BigNumber(10).pow(9)
                ),
                createdAt: new Date(txn.timestamp * 1_000),
            };

            // we then need to lookup the data
            const tokenContractAddresses = new Set(
                transfers.map((t) => t.contractAddress)
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

            const decoratedTransfers = transfers.map(
                (tr): TradingIntegrationTransfer => {
                    const metadata = metadataByContract[tr.contractAddress];

                    return {
                        type: tr.type,
                        amount: tr.amount,
                        from: tr.from,
                        to: tr.to,
                        contractAddress: tr.contractAddress,
                        decimals: tr.decimals ?? metadata?.token_info?.decimals,
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

            return success({
                ...transaction,
                transfers: decoratedTransfers,
                description,
            });
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };

if (require.main === module) {
    connect()
        .then(async () => {
            const txn = await getTransaction({
                walletAddress: "918YSnCPmBP8yqxmzUAxMggjrAPzkhMFx4e8J8UedAyA",
                hash: "5vjVY736wL83SHHZmv3WUACkPNYu6miGt4ACQp2o2tuPup255yLkUkfononejHL2BRKSmgVE7CYoQhR1zihg5CRu",
            });

            console.log(txn);
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
