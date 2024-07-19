import { AccountProvider, Swap } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import { connection } from "src/utils/helius/constants";
import { isNil } from "lodash";
import { swapRepo } from "../../infra/postgres";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { helius } from "src/utils";
import { solana } from "src/utils/solana";

const getStatus = async (
    swap: Swap
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { status: SwapStatus; failedReason: Maybe<string> }
    >
> => {
    if (swap.chain === AccountProvider.Solana) {
        const statusResponse = await helius.transactions.getStatus(
            connection,
            swap.hash
        );

        if (statusResponse.isFailure()) {
            return failure(statusResponse.error);
        }

        const statusInfo = statusResponse.value;

        // if no status, if within 5 minutes fail it otherwise leave as pending
        if (!statusInfo) {
            const isWithinTimeframe =
                Date.now() - swap.createdAt.getTime() < 2 * 60 * 1000;
            const status = isWithinTimeframe
                ? SwapStatus.Pending
                : SwapStatus.Failed;

            return success({
                status,
                failedReason:
                    "Solana may be congested, causing the transaction to timeout.",
            });
        }

        const { info } = statusInfo;

        if (!isNil(info.err)) {
            console.log("==== transaction errored ====");
            const failedReason = await solana.getFailedReason(swap.hash);

            return success({
                status: SwapStatus.Failed,
                failedReason,
            });
        }

        if (info.confirmationStatus === "finalized") {
            return success({
                status: SwapStatus.Finalized,
                failedReason: null,
            });
        }

        if (info.confirmationStatus === "processed") {
            return success({
                status: SwapStatus.Processed,
                failedReason: null,
            });
        }

        if (info.confirmationStatus === "confirmed") {
            return success({
                status: SwapStatus.Confirmed,
                failedReason: null,
            });
        }

        return success({
            status: SwapStatus.Pending,
            failedReason: null,
        });
    }

    return failure(
        new Error("We do not support syncing status for this chain.")
    );
};
const syncStatus = async (
    swap: Swap
): Promise<FailureOrSuccess<DefaultErrors, Swap>> => {
    const statusResponse = await getStatus(swap);

    if (statusResponse.isFailure()) {
        return failure(statusResponse.error);
    }

    const { status, failedReason } = statusResponse.value;

    return swapRepo.update(swap.id, {
        status: status,
        failedReason,
    });
};

export const SwapStatusService = {
    syncStatus,
    getStatus,
};
