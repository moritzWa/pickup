import { Datadog, coingecko, logHistogram } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import moment = require("moment");
import { InngestEventName } from "../../types";
import { UserService } from "src/modules/users/services";
import { algolia } from "src/utils/algolia";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { User } from "src/core/infra/postgres/entities";
import { EmailJobData, NotificationChannel } from "../types";
import { UnexpectedError, failure, success } from "src/core/logic";
import { parallel } from "radash";

// every 60 minutes
const CRON = "*/60 * * * *";
const NAME = "How Did You Find Us Email";

const howDidYouFindUsEmail = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async () => await runHowDidYouFindUsEmail()
);

export const runHowDidYouFindUsEmail = async () => {
    const start = Date.now();

    // grab all unsynced usernames
    const usersResponse = await pgUserRepo.find({
        where: {
            // find users createdAt more than a day ago
            hasEmailedFeedback: false,
            createdAt: LessThanOrEqual(moment().subtract(1, "day").toDate()),
        },
        take: 100,
    });

    if (usersResponse.isFailure()) {
        throw usersResponse.error;
    }

    // mass update these users to has emailed feedback

    const users = usersResponse.value;

    console.log(`[sending email to ${users.length} users]`);

    if (!users.length) {
        return success(null);
    }

    await parallel(10, users, sendHowDidYouFindUsEmail);

    await pgUserRepo.bulkUpdate(
        users.map((u) => u.id),
        {
            hasEmailedFeedback: true,
        }
    );

    console.log(`Successfully sent how did you find us email.`);
};

const sendHowDidYouFindUsEmail = async (user: User) => {
    try {
        // people don't really have names on our platform atm
        const firstName = (user.name || "").split(" ")[0] || "";

        const data: EmailJobData = {
            channel: NotificationChannel.Email,
            subject: `Quick question from Movement`,
            fromEmail: "team@movement.market",
            fromName: "Movement",
            html: `
                <div>
                    Hello${firstName ? " " + firstName : ""},
                    <br /><br />
                    Quick question--how did you find out about Movement (https://movement.market)?
                    <br />
                    <br />
                    Best,
                    <br />
                    Movement Team
                    <br />
                    <br />
                    P.S. Want to earn 20 USDC for a quick zoom call on how we can make Movement better? Just reply to this email letting us know.
                </div>
            `,
            toEmails: [{ email: user.email, name: user.name || "" }],
        };

        await inngest.send({
            data,
            name: InngestEventName.SendNotification,
        });

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export { howDidYouFindUsEmail };
