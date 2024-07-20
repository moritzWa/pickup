import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { twilio } from "src/utils/twilio";
import { config } from "src/config";
import { pgUserRepo } from "../../infra/postgres";

export const textDownloadLink = mutationField("textDownloadLink", {
    type: nonNull("String"),
    args: {
        phoneNumber: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { phoneNumber } = args;

        const me = ctx.me!;

        const message = `Download the Movement app here: ${config.appStoreUrl}!`;

        const response = await twilio.sms.send(phoneNumber, message);

        throwIfError(response);

        // if there is a user without phone number, store the phone number on their account
        // that way in the app we can autofill it when they are claiming airdrop
        // but don't throw if this errors, it can fail that is fine
        if (me && !me.phoneNumber) {
            await pgUserRepo.update(me.id, {
                phoneNumber,
                hasVerifiedPhoneNumber: false,
            });
        }

        return "Sent download link!";
    },
});
