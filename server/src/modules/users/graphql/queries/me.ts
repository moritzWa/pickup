import { nullable, queryField } from "nexus";
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

export const me = queryField("me", {
    type: nullable("User"),
    resolve: async (_parent, _args, ctx: Context) => {
        // console.log(ctx);

        if (ctx.me) {
            const user = ctx.me!;
            analytics.identify({
                userId: user.id,
                traits: {
                    name: user.name,
                    email: user.email,
                    id: user.id,
                    createdAt: user.createdAt,
                    hasMobile: user.hasMobile,
                    hasPushNotificationsEnabled:
                        user.hasPushNotificationsEnabled,
                    isReferred: !isNil(user.referredByCode),
                },
            });
        }

        const user = ctx.me;

        if (!user) {
            return null;
        }

        return _hydrateWallets(user);
    },
});

const _hydrateWallets = async (user: User): Promise<User> => {
    const hasSolanaWallet = !!(user.wallets ?? []).find(
        (u) => u.provider === AccountProvider.Solana
    );

    const magicUserResponse = await magic.users.byIssuer(user.magicIssuer);

    if (
        magicUserResponse.isSuccess() &&
        magicUserResponse.value.email &&
        magicUserResponse.value.email !== user.email
    ) {
        await pgUserRepo.update(user.id, {
            email: magicUserResponse.value.email,
        });
    }

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
