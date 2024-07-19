import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog, helius, jito } from "src/utils";
import { Slack, SlackChannel } from "src/utils/slack";
import { trackError } from "src/utils/trackDatadog";
import { inngest } from "../clients";
import { InngestEventName, SubmitTransactionData } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { config } from "src/config";
import { SyncTransactionsService } from "src/modules/transactions/services";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { solana, SolanaError } from "src/utils/solana";
import { AccountProvider, User } from "src/core/infra/postgres/entities";
import { SwapStatus, SwapType } from "src/core/infra/postgres/entities/Trading";
import {
    swapEventRepo,
    swapFeeRepo,
    swapRepo,
} from "src/modules/trading/infra/postgres";
import {
    NotificationService,
    SendNotificationParams,
} from "src/modules/notifications/services/notificationService";
import { ProfileService } from "src/modules/profile/services";
import { chunk } from "lodash";
import { sleep } from "radash";

const NAME = "Send Buy Notifications";
const RETRIES = 5;

type NotificationData = SendNotificationParams & {
    toUser: Pick<User, "id" | "hasPushNotificationsEnabled">;
};

const sendBuyNotifications = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: {
            limit: 5,
            key: "event.data.userId",
        },
        retries: RETRIES,
    },
    { event: InngestEventName.SendBuyNotifications },
    async ({ event, step, runId }) => {
        console.info(`[syncing swap ${runId}]`);

        const data = event.data;

        await step.run("send-buy-notifications", () =>
            _notifyFollowers(data.swapId)
        );
    }
);

const _notifyFollowers = async (swapId: string) => {
    const swapResponse = await swapRepo.findById(swapId);

    if (swapResponse.isFailure()) {
        throw swapResponse.error;
    }

    const swap = swapResponse.value;

    if (!swap.userId) {
        return Promise.resolve();
    }

    if (swap.type !== SwapType.Buy) {
        console.log(`[swap ${swapId} is not a buy so not notifying followers]`);
        return Promise.resolve();
    }

    if (swap.status === SwapStatus.Failed) {
        console.log(`[swap ${swapId} failed so not notifying followers]`);
        return Promise.resolve();
    }

    const traderUserResponse = await pgUserRepo.findById(swap.userId);

    if (traderUserResponse.isFailure()) {
        throw traderUserResponse.error;
    }

    const traderUser = traderUserResponse.value;

    const relationshipsResponse =
        await ProfileService.getFollowersToNotifyOnBuy(swap.userId);

    if (relationshipsResponse.isFailure()) {
        throw relationshipsResponse.error;
    }

    const relationships = relationshipsResponse.value;

    console.log(`[notifying ${relationships.length} followers]`);

    if (!relationships.length) {
        return Promise.resolve();
    }

    const notifications: NotificationData[] = [];

    Datadog.increment(
        "inngest.send_buy_notifications.count",
        relationships.length
    );

    for (const relationship of relationships) {
        const data: NotificationData = {
            idempotency: `${swap.id}-${relationship.id}`,
            title: `@${traderUser.username}`,
            subtitle: `just bought ${swap.receiveSymbol}`,
            iconImageUrl: swap.receiveIconImageUrl,
            followerUserId: null,
            toUser: relationship,
            tokenContractAddress: swap.receiveTokenContractAddress,
            tokenProvider: swap.chain,
        };

        notifications.push(data);
    }

    const chunks = chunk(notifications, 100);

    // process in chunks of 100 to not overload the system
    for (const ch of chunks) {
        await Promise.all(
            ch.map((data) =>
                NotificationService.createAndSend(data.toUser, data)
            )
        );

        await sleep(500);
    }
};

export default sendBuyNotifications;
