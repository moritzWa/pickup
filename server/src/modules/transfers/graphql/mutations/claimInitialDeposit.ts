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
import { D, Datadog, Slack, SlackChannel } from "src/utils";
import {
    AccountProvider,
    CurrencyCode,
    User,
} from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { isNil } from "lodash";

export const claimInitialDeposit = mutationField("claimInitialDeposit", {
    type: nonNull("String"),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        throw new ApolloError("Sorry, our free $1 USDC promotion is over!");

        // if (user.hasClaimedInitialDeposit) {
        //     throw new ApolloError(
        //         "You've already claimed your free USDC. Contact customer support if you have any questions.",
        //         "400"
        //     );
        // }

        // const estimatedPortfolioValue = user.estimatedPortfolioValueCents;

        // if (!isNil(estimatedPortfolioValue) && estimatedPortfolioValue > 0) {
        //     throw new ApolloError(
        //         "You can only claim the USDC if you haven't deposited money yet. Contact customer support if you have any questions.",
        //         "400"
        //     );
        // }

        // // if (!user.hasVerifiedPhoneNumber || !user.phoneNumber) {
        // //     throw new ApolloError(
        // //         "You must verify your phone number before claiming the USDC. You can do this on the profile page.",
        // //         "400"
        // //     );
        // // }

        // if (!user.mobileDeviceId) {
        //     throw new ApolloError(
        //         "You must have a mobile device linked to your account to claim the USDC. Please download the app to proceed.",
        //         "400"
        //     );
        // }

        // await inngest.send({
        //     name: InngestEventName.ClaimInitialDeposit,
        //     data: { userId: user.id },
        // });

        // return "Success!";
    },
});
