import { floatArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { me } from "src/modules/users/graphql";
import { Slack, SlackChannel } from "src/utils";

export const logMagicIssue = mutationField("logMagicIssue", {
    type: nonNull("String"),
    args: {
        device: nullable(stringArg()),
        message: nullable(stringArg()),
        ipAddress: nullable(stringArg()),
        latency: nullable(floatArg()),
    },
    resolve: async (_p, args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const msg = [
            `Magic Stuck 🐌`,
            args.message,
            `IP Address: ${args.ipAddress || "unknown"}`,
            `Device: ${args.device || "unknown"}`,
            `Timestamp: ${new Date().toISOString()}`,
            `Latency: ${args.latency || 0}ms`,
            `\nUser: ${user.name} (${user.email}, ${user.magicIssuer})`,
            `Version: ${user.mobileAppVersion || "none"}`,
            `Signed up ${user.createdAt.toISOString()}`,
        ].join("\n");

        console.log("[logging magic stuck]");
        console.log(msg);

        await Slack.send({
            message: msg,
            format: true,
            channel: SlackChannel.LogsMagicStuck,
        });

        return "OK";
    },
});
