import {
    mutationField,
    nullable,
    objectType,
    nonNull,
    stringArg,
    idArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import { D, Datadog, Slack, SlackChannel } from "src/utils";
import { swapEventRepo } from "../../infra/postgres";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { SWAP_STATUS_TO_DOMAIN } from "../types";
import { v4 as uuidv4 } from "uuid";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const createSwapEvent = mutationField("createSwapEvent", {
    type: nonNull("String"),
    args: {
        hash: nullable(stringArg()),
        chain: nonNull("AccountProviderEnum"),
        status: nonNull("SwapStatusEnum"),
        isTimedOut: nonNull("Boolean"),
        durationSeconds: nonNull("Float"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { hash, status, chain, isTimedOut, durationSeconds } = args;
        const user = ctx.me!;

        Datadog.increment("trading.swaps.status", {
            status,
        });

        if (isTimedOut) {
            await Slack.send({
                channel: SlackChannel.Swaps,
                format: true,
                message: [
                    `🔴 Swap timed out bc of network congestion ${user.email} (${user.id})\n`,
                ].join("\n"),
            });
        }

        if (status === "failed" && !isTimedOut) {
            const blockExplorerUrl = BlockExplorerService.getBlockExplorerInfo(
                ACCOUNT_PROVIDER_GQL_TO_DOMAIN[chain],
                hash || "N/A"
            )?.url;

            await Slack.send({
                channel: SlackChannel.Swaps,
                format: true,
                message: [
                    `🔴 Swap failed by ${user.email} (${user.id})\n`,
                    `Hash: ${hash} (${chain})`,
                    `Block explorer: ${blockExplorerUrl || ""}`,
                ].join("\n"),
            });
        }

        const swapEventResponse = await swapEventRepo.create({
            status: SWAP_STATUS_TO_DOMAIN[status],
            chain: ACCOUNT_PROVIDER_GQL_TO_DOMAIN[chain],
            hash: hash ?? null,
            isTimedOut,
            durationSeconds,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
        });

        if (
            swapEventResponse.isSuccess() &&
            swapEventResponse.value.isTimedOut
        ) {
            Datadog.increment("trading.swaps.timed_out");
        }

        throwIfError(swapEventResponse);

        return "ok";
    },
});
