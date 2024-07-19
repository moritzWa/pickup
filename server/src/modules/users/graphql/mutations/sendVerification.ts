import { mutationField, nonNull, stringArg } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { twilio } from "src/utils/twilio";
import { pgUserRepo } from "../../infra/postgres";
import { ApolloError } from "apollo-server-errors";

export const sendVerification = mutationField("sendVerification", {
    type: nonNull("String"),
    args: {
        phoneNumber: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { phoneNumber } = args;

        // if the phone number is new, un-verify the phone
        if (user.phoneNumber !== phoneNumber) {
            // update the user
            const userResponse = await pgUserRepo.update(user.id, {
                hasVerifiedPhoneNumber: false,
            });

            throwIfError(userResponse);
        }

        const isAllowedResponse = await twilio.phoneNumberIsAllowed(
            phoneNumber
        );

        throwIfError(isAllowedResponse);

        const isAllowed = isAllowedResponse;

        if (!isAllowed) {
            throw new ApolloError(
                "Only personal numbers are allowed. If you think this is a mistake, contact customer support.",
                "400"
            );
        }

        const response = await twilio.sendCode(phoneNumber);

        throwIfError(response);

        return "Successfully sent verification code.";
    },
});
