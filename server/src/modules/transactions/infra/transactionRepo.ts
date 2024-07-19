import {
    EntityManager,
    FindManyOptions,
    FindOptionsWhere,
    getRepository,
    In,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AccountProvider,
    Transaction,
    Transaction as TransactionModel,
    Transfer,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { chunk } from "lodash";
import { promise } from "zod";

type TransactionResponse = FailureOrSuccess<DefaultErrors, TransactionModel>;
type TransactionArrayResponse = FailureOrSuccess<
    DefaultErrors,
    TransactionModel[]
>;

export type TxnUpsertInfo = {
    txn: Omit<TransactionModel, "transfers" | "user">;
    transfers: Omit<Transfer, "transaction" | "user">[];
};

export class PostgresTransactionRepository {
    constructor(private model: typeof TransactionModel) {}

    private get repo(): Repository<TransactionModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<TransactionModel>
    ): Promise<TransactionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async count(
        options: FindManyOptions<TransactionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        transactionId: string,
        options: FindManyOptions<TransactionModel>
    ): Promise<TransactionResponse> {
        try {
            const transaction = await this.repo.findOne({
                ...options,
                where: {
                    ...options?.where,
                    id: transactionId,
                },
            });

            if (!transaction) {
                return failure(new NotFoundError("Transaction not found."));
            }

            return success(transaction);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(
        transactionIds: string[]
    ): Promise<TransactionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const transactions = await this.repo
                .createQueryBuilder()
                .where("id IN (:...transactionIds)", { transactionIds })
                .getMany();

            return success(transactions);
        });
    }

    async findForUser(
        userId: string,
        opts?: FindManyOptions<TransactionModel>
    ): Promise<TransactionArrayResponse> {
        try {
            const transactions = await this.repo.find({
                ...opts,
                where: {
                    ...opts?.where,
                    userId: userId,
                },
            });

            return success(transactions);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // async findForHash(
    //     userId: string,
    //     hash: string,
    //     provider: AccountProvider,
    //     opts?: FindManyOptions<TransactionModel>
    // ): Promise<TransactionResponse> {
    //     try {
    //         const transaction = await this.repo.findOne({
    //             ...opts,
    //             where: {
    //                 ...opts?.where,
    //                 hash: hash,
    //                 provider: provider,
    //                 userId: userId,
    //             },
    //         });

    //         if (!transaction) {
    //             return failure(new NotFoundError("Transaction not found."));
    //         }

    //         return success(transaction);
    //     } catch (err) {
    //         return failure(new UnexpectedError(err));
    //     }
    // }

    async existsForHash(
        userId: string,
        hash: string,
        provider: AccountProvider,
        opts?: FindManyOptions<TransactionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const txn = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    hash: hash,
                    provider: provider,
                    userId: userId,
                },
            });

            if (!txn) {
                return success(false);
            }

            return success(true);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    findForUserForToken = async (
        userId: string,
        tokenContractAddress: string,
        provider: AccountProvider,
        opts?: FindManyOptions<TransactionModel>
    ): Promise<TransactionArrayResponse> => {
        try {
            const transactionIdsWithMatchingTransfers = await this.repo
                .createQueryBuilder("transaction")
                .leftJoin("transaction.transfers", "transfer")
                .where("transaction.user_id = :userId", { userId })
                .andWhere(
                    "transfer.token_contract_address = :tokenContractAddress",
                    { tokenContractAddress: tokenContractAddress }
                )
                .andWhere("transfer.provider = :provider", { provider })
                .select("transaction.id")
                .getMany();

            const matchingTransactionIds =
                transactionIdsWithMatchingTransfers.map((tx) => tx.id);

            if (!matchingTransactionIds.length) {
                return success([]);
            }

            // Now, query for transactions that match those IDs, without applying the filter to the transfers
            const where: FindOptionsWhere<Transaction> =
                matchingTransactionIds.length > 0
                    ? { id: In(matchingTransactionIds) }
                    : {};

            const txnsResponse = await this.repo.find({
                ...opts,
                where: {
                    ...where,
                    userId,
                },
                order: {
                    createdAt: opts?.order?.createdAt ?? "DESC",
                },
                relations: {
                    transfers: true, // This ensures all transfers are loaded
                },
            });

            return success(txnsResponse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    async update(
        transactionId: string,
        updates: Partial<TransactionModel>,
        dbTxn?: EntityManager
    ): Promise<TransactionResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: transactionId }, updates)
                : await this.repo.update(transactionId, updates);

            const transaction = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: transactionId })
                : await this.repo.findOneBy({ id: transactionId });

            if (!transaction) {
                return failure(
                    new NotFoundError("Transaction does not exist!")
                );
            }

            return success(transaction);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: TransactionModel): Promise<TransactionResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    upsert = async (
        transactions: TxnUpsertInfo[]
    ): Promise<FailureOrSuccess<DefaultErrors, null>> => {
        try {
            const promises: Promise<any>[] = [];

            for (const txn of transactions) {
                // make a mini db txn to insert the txn + the transfer
                promises.push(
                    this.repo.manager.transaction(async (dbTxn) => {
                        const exists = await dbTxn.exists(TransactionModel, {
                            where: {
                                hash: txn.txn.hash,
                                userId: txn.txn.userId,
                            },
                        });

                        if (exists) {
                            // delete the txns
                            await dbTxn.delete(TransactionModel, {
                                hash: txn.txn.hash,
                                userId: txn.txn.userId,
                            });
                        }

                        await dbTxn.save(TransactionModel, txn.txn);

                        await dbTxn
                            .createQueryBuilder()
                            .insert()
                            .into(Transfer)
                            .values(txn.transfers)
                            .execute();
                    })
                );
            }

            const results = await Promise.all(promises);

            return success(null);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    // hard delete
    async delete(transactionId: string): Promise<TransactionResponse> {
        try {
            const transaction = await this.repo.findOne({
                where: { id: transactionId },
            });

            if (!transaction) {
                return failure(
                    new NotFoundError("Transaction does not exist!")
                );
            }

            await this.repo.delete({ id: transactionId });

            return success(transaction);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<TransactionModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<TransactionResponse> {
        try {
            const newTransaction = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newTransaction);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
