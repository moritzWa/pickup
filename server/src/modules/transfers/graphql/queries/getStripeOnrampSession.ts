import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TradingIntegrationService } from "src/shared/integrations";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import BigNumber from "bignumber.js";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { WRAPPED_SOL_MINT } from "src/shared/integrations/providers/solana/constants";
import { stripe } from "src/utils";
import { magic } from "src/utils/magic";
import { WalletType } from "@magic-sdk/admin";

export const getStripeOnrampSession = queryField("getStripeOnrampSession", {
    type: nonNull("String"),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const magicUserResponse = await magic.wallets.getPublicAddress(
            user.magicIssuer,
            WalletType.SOLANA
        );

        throwIfError(magicUserResponse);

        const publicAddress = magicUserResponse.value?.publicAddress;

        if (!publicAddress) {
            throw new Error("No public address found");
        }

        const onrampSessionResponse = await stripe.onramp.solana(
            publicAddress,
            user
        );

        throwIfError(onrampSessionResponse);

        return onrampSessionResponse.value;
    },
});
