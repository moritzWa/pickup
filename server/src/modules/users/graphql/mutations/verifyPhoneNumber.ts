import { mutationField, nonNull, stringArg } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { twilio } from "src/utils/twilio";
import { pgUserRepo } from "../../infra/postgres";
import { ApolloError } from "apollo-server-errors";

export const verifyPhoneNumber = mutationField("verifyPhoneNumber", {
    type: nonNull("User"),
    args: {
        phoneNumber: nonNull(stringArg()),
        otpCode: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        console.log("VERIFYING at " + new Date().toISOString());

        const user = ctx.me!;
        const { phoneNumber, otpCode } = args;

        const response = await twilio.verifyCode(phoneNumber, otpCode);

        if (response.isFailure()) {
            throw new ApolloError(response.error.message, "400");
        }

        const numUsersWithPhoneResponse = await pgUserRepo.count({
            where: { phoneNumber },
        });

        throwIfError(numUsersWithPhoneResponse);

        const numUsersWithPhone = numUsersWithPhoneResponse.value;

        if (numUsersWithPhone > 0) {
            throw new ApolloError(
                "This phone number is already used for another account.",
                "400"
            );
        }

        // update the user
        const userResponse = await pgUserRepo.update(user.id, {
            phoneNumber,
            hasVerifiedPhoneNumber: true,
        });

        throwIfError(userResponse);

        const newUser = userResponse.value;

        return newUser;
    },
});
