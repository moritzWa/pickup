import {
    AccountProvider,
    Swap,
    Withdrawal,
} from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import { connection } from "src/utils/helius/constants";
import { isNil } from "lodash";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { helius } from "src/utils";
import { solana } from "src/utils/solana";
import { WithdrawalStatus } from "src/core/infra/postgres/entities/Withdrawal";
import { withdrawalRepo } from "../infra";

const getStatus = async (
    withdrawal: Withdrawal
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { status: WithdrawalStatus; failedReason: Maybe<string> }
    >
> => {
    if (withdrawal.chain === AccountProvider.Solana) {
        const statusResponse = await helius.transactions.getStatus(
            connection,
            withdrawal.hash || ""
        );

        if (statusResponse.isFailure()) {
            return failure(statusResponse.error);
        }

        const statusInfo = statusResponse.value;

        // if no status, if within 5 minutes fail it otherwise leave as pending
        if (!statusInfo) {
            const isWithinTimeframe =
                Date.now() - withdrawal.createdAt.getTime() < 2 * 60 * 1000;
            const status = isWithinTimeframe
                ? WithdrawalStatus.Pending
                : WithdrawalStatus.Failed;

            return success({
                status,
                failedReason:
                    "Solana may be congested, causing the transaction to timeout.",
            });
        }

        const { info } = statusInfo;

        if (!isNil(info.err)) {
            console.log("==== transaction errored ====");
            const failedReason = await solana.getFailedReason(
                withdrawal.hash || ""
            );

            return success({
                status: WithdrawalStatus.Failed,
                failedReason,
            });
        }

        if (info.confirmationStatus === "finalized") {
            return success({
                status: WithdrawalStatus.SendFunds,
                failedReason: null,
            });
        }

        if (info.confirmationStatus === "processed") {
            return success({
                status: WithdrawalStatus.Pending,
                failedReason: null,
            });
        }

        if (info.confirmationStatus === "confirmed") {
            return success({
                status: WithdrawalStatus.SendFunds,
                failedReason: null,
            });
        }

        return success({
            status: WithdrawalStatus.Pending,
            failedReason: null,
        });
    }

    return failure(
        new Error("We do not support syncing status for this chain.")
    );
};
const syncStatus = async (
    withdrawal: Withdrawal
): Promise<FailureOrSuccess<DefaultErrors, Withdrawal>> => {
    const statusResponse = await getStatus(withdrawal);

    if (statusResponse.isFailure()) {
        return failure(statusResponse.error);
    }

    const { status, failedReason } = statusResponse.value;

    return withdrawalRepo.update(withdrawal.id, {
        status: status,
        failedReason,
    });
};

export const WithdrawalStatusService = {
    syncStatus,
    getStatus,
};
