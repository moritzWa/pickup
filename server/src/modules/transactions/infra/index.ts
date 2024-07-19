import { Transaction, Transfer } from "src/core/infra/postgres/entities";
import { PostgresTransactionRepository } from "./transactionRepo";
import { PostgresTransferRepository } from "./transferRepo";

export const transactionRepo = new PostgresTransactionRepository(Transaction);
export const transferRepo = new PostgresTransferRepository(Transfer);
