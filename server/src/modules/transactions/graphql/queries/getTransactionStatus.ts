import { list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import { helius } from "src/utils";
import { connection } from "src/utils/helius/constants";
import { TransactionStatus } from "src/core/infra/postgres/entities";

export const getTransactionStatus = queryField("getTransactionStatus", {
    type: nonNull("TransactionStatusEnum"),
    args: {
        hash: nonNull("String"),
        chain: nonNull("AccountProviderEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { hash, chain } = args;

        if (chain === "solana") {
            // get the status with helius
            const statusResponse = await helius.transactions.getStatus(
                connection,
                hash
            );

            throwIfError(statusResponse);

            const statusInfo = statusResponse.value;

            if (!statusInfo) {
                return TransactionStatus.Pending;
            }

            const { status } = statusInfo;

            return status;
        }

        throw new ApolloError(
            "Invalid chain",
            StatusCodes.BAD_REQUEST.toString()
        );
    },
});
