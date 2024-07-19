import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
    mutationField,
    floatArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { depositRepo } from "../../infra/postgres";
import { v4 as uuidv4 } from "uuid";
import {
    DepositSource,
    DepositStatus,
} from "src/core/infra/postgres/entities/Deposit";
import { throwIfError } from "src/core/surfaces/graphql/common";
import BigNumber from "bignumber.js";
import { ApolloError } from "apollo-server-errors";
import moment = require("moment");
import { MoreThan } from "typeorm";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { sumBigNumbers } from "src/utils";

const MAX_WEEKLY_DEPOSITS = 200;

export const createDeposit = mutationField("createDeposit", {
    type: nonNull("Deposit"),
    args: {
        amount: nonNull(floatArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { amount } = args;

        const user = ctx.me!;

        throw new ApolloError(
            "Venmo deposits are no longer supported. Please contact support if you have questions."
        );

        if (!user.canVenmoDeposit) {
            throw new ApolloError(
                "Sorry, you are not allowed to deposit via Venmo."
            );
        }

        const canDepositResponse = await _canDeposit(
            user.id,
            new BigNumber(amount)
        );

        throwIfError(canDepositResponse);

        const depositResponse = await depositRepo.create({
            id: uuidv4(),
            sourceType: "integration",
            userId: user.id,
            source: DepositSource.Venmo,
            paypalOrderId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            amount: new BigNumber(amount),
            status: DepositStatus.Pending,
            hasSentFunds: false,
            transactionHash: null,
        });

        throwIfError(depositResponse);

        return depositResponse.value;
    },
});

const _canDeposit = async (
    userId: string,
    amount: BigNumber
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const oneWeekAgo = moment().subtract(1, "week").toDate();

    const weeklyDepositsResponse = await depositRepo.findForUser(userId, {
        where: {
            status: DepositStatus.Completed,
            createdAt: MoreThan(oneWeekAgo),
        },
    });

    if (weeklyDepositsResponse.isFailure()) {
        return failure(weeklyDepositsResponse.error);
    }

    const totalWeeklyDeposits = sumBigNumbers(
        weeklyDepositsResponse.value.map((d) => d.amount)
    );

    const totalWeeklyAfterAmount = totalWeeklyDeposits.plus(amount);

    if (totalWeeklyAfterAmount.isGreaterThan(MAX_WEEKLY_DEPOSITS)) {
        return failure(
            new ApolloError(
                "You have exceeded the weekly deposit limit of $250."
            )
        );
    }

    return success(null);
};
