import { list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";

export const getPaymentMethods = queryField("getPaymentMethods", {
    type: nonNull(list(nonNull("PaymentMethod"))),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const stripeCustomerId = user.stripeCustomerId;

        if (!stripeCustomerId) {
            return [];
        }

        const cardsResponse = await stripe.client.customers.listPaymentMethods(
            stripeCustomerId,
            {
                type: "card",
            }
        );

        const cards = cardsResponse.data;

        return cards.map((c) => ({
            paymentMethodId: c.id,
            last4: c.card?.last4 || "",
            source: c.card?.brand || "",
        }));
    },
});
