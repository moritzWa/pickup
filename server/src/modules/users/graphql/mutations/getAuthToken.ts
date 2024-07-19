import { mutationField, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { analytics } from "src/utils/segment";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { magic } from "src/utils/magic";
import { WalletType } from "@magic-sdk/admin";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { pgUserRepo } from "../../infra/postgres";
import { User, UserWallet } from "src/core/infra/postgres/entities/User";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getAuthToken = mutationField("getAuthToken", {
    type: nonNull("String"),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const tokenResponse = await FirebaseProvider.signToken(
            me.authProviderId
        );

        throwIfError(tokenResponse);

        return tokenResponse.value;
    },
});

const _hydrateWallets = async (user: User): Promise<User> => {
    const hasSolanaWallet = !!(user.wallets ?? []).find(
        (u) => u.provider === AccountProvider.Solana
    );

    if (hasSolanaWallet) {
        return user;
    }

    // make sure they have sol wallet
    const walletResponse = await magic.wallets.getPublicAddress(
        user.magicIssuer,
        WalletType.SOLANA
    );

    if (
        walletResponse.isSuccess() &&
        walletResponse.value &&
        walletResponse.value.publicAddress
    ) {
        const wallet = walletResponse.value;
        const newWallets: UserWallet[] = [
            ...(user.wallets ?? []),
            {
                provider: AccountProvider.Solana,
                publicKey: wallet.publicAddress!,
            },
        ];

        const userResponse = await pgUserRepo.update(user.id, {
            wallets: newWallets,
        });

        if (userResponse.isSuccess()) {
            return userResponse.value;
        }
    }

    return user;
};
