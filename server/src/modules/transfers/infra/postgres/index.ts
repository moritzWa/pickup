import { Deposit, Withdrawal } from "src/core/infra/postgres/entities";
import { PostgresDepositRepository } from "./depositRepo";
import { PostgresWithdrawalRepository } from "./withdrawalRepo";

export const depositRepo = new PostgresDepositRepository(Deposit);
export const withdrawalRepo = new PostgresWithdrawalRepository(Withdrawal);
