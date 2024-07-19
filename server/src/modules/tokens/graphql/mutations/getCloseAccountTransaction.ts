import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
    mutationField,
    floatArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { D, Datadog, Slack, SlackChannel, helius } from "src/utils";
import { SolanaError, solana } from "src/utils/solana";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { v4 as uuidv4 } from "uuid";
import { WithdrawalStatus } from "src/core/infra/postgres/entities/Withdrawal";
import BigNumber from "bignumber.js";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { inngest, sendToInngest } from "src/jobs/inngest/clients";
import { InngestEventName, SubmitWithdrawalData } from "src/jobs/inngest/types";
import {
    TOKEN_PROGRAM_ID,
    createCloseAccountInstruction,
} from "@solana/spl-token";
import { WRAPPED_SOL_MINT } from "src/shared/integrations/providers/solana/constants";
import {
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";

export const GetCloseAccountTransactionResponse = objectType({
    name: "GetCloseAccountTransactionResponse",
    definition: (t) => {
        t.nonNull.string("rawTransaction");
        t.nonNull.string("blockhash");
        t.nonNull.float("blockHeight");
    },
});

export const getCloseAccountTransaction = mutationField(
    "getCloseAccountTransaction",
    {
        type: nonNull("GetCloseAccountTransactionResponse"),
        resolve: async (_parent, args, ctx: Context) => {
            throwIfNotAuthenticated(ctx);

            const user = ctx.me!;

            const solanaWallet = (user.wallets ?? []).find(
                (w) => w.provider === AccountProvider.Solana
            );

            if (!solanaWallet) {
                throw new ApolloError("Solana wallet not found.", "404");
            }

            const pubKey = solanaWallet.publicKey;

            const closeAccountTxnResponse =
                await solana.buildUnwrapSolTransaction(pubKey);

            throwIfError(closeAccountTxnResponse);

            return closeAccountTxnResponse.value;
        },
    }
);
