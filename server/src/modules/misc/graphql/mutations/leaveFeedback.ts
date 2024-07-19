import { mutationField, nonNull } from "nexus";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { Slack, SlackChannel } from "src/utils";

export const leaveFeedback = mutationField("leaveFeedback", {
    type: nonNull("String"),
    args: {
        message: nonNull("String"),
    },
    resolve: async (_p, args, ctx) => {
        const { message } = args;

        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        await Slack.send({
            message: [
                message,
                `\n\nSubmitted by ${user.name} (${user.email})`,
            ].join(""),
            format: true,
            channel: SlackChannel.TradingFeedback,
        });

        return "OK";
    },
});
