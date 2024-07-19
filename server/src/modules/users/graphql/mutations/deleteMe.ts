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
import { magic } from "src/utils/magic";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { createFullUser } from "../../services/createFullUser";
import { ProfileService } from "src/modules/profile/services";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { pgUserRepo } from "../../infra/postgres";
import {
    EmailJobData,
    NotificationChannel,
} from "src/jobs/inngest/functions/types";
import { inngest, sendToInngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { UnexpectedError, failure, success } from "src/core/logic";
import { User } from "src/core/infra/postgres/entities";
import { loops } from "src/utils/loops";

export const deleteMe = mutationField("deleteMe", {
    type: nonNull("String"),
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;

        // remove from firebase, don't await it tho
        await FirebaseProvider.deleteUser(me.authProviderId);

        await loops.contacts.delete(me.email);

        const response = await pgUserRepo.delete(me.id);

        throwIfError(response);

        // send an email
        void _sendDeletedAccount(me);

        return "Successfully deleted account.";
    },
});

const _sendDeletedAccount = async (user: User) => {
    try {
        const firstName = user.name?.split(" ")[0];

        const data: EmailJobData = {
            channel: NotificationChannel.Email,
            subject: `Movement: Account deleted`,
            fromEmail: "team@movement.market",
            fromName: "Movement",
            html: `
            <div>
                Hello${firstName ? " " + firstName : ""},
                <br /><br />
                Your account has been successfully deleted. Your information has been removed from our system and cannot be recovered.
                <br /><br />
                If you didn't request this, please contact us immediately. Thank you for being a part of Movement.
                <br />
                <br />
                Best,
                <br />
                Movement Team
            </div>
        `,
            toEmails: [{ email: user.email, name: user.name || "" }],
        };

        await sendToInngest(
            async () =>
                await inngest.send({
                    data,
                    name: InngestEventName.SendNotification,
                })
        );

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
