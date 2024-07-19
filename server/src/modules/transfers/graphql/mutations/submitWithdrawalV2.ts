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
import {
    AccountProvider,
    CurrencyCode,
    User,
} from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import { SolanaError, solana } from "src/utils/solana";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { withdrawalRepo } from "../../infra";
import { v4 as uuidv4 } from "uuid";
import { WithdrawalStatus } from "src/core/infra/postgres/entities/Withdrawal";
import BigNumber from "bignumber.js";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { inngest, sendToInngest } from "src/jobs/inngest/clients";
import { InngestEventName, SubmitWithdrawalData } from "src/jobs/inngest/types";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";

export const submitWithdrawalV2 = mutationField("submitWithdrawalV2", {
    type: nonNull("Withdrawal"),
    args: {
        chain: nonNull("AccountProviderEnum"),
        blockHeight: nonNull(floatArg()),
        blockhash: nullable(stringArg()),
        rawTransaction: nonNull(stringArg()),
        type: nullable(stringArg()), // "crypto" | "offramp"
        kadoOrderId: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const {
            blockHeight,
            rawTransaction,
            chain: _chain,
            blockhash: _blockhash,
            kadoOrderId,
        } = args;

        let blockhash: string | null = _blockhash ?? null;

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        if (!blockhash) {
            const blockhashResponse = await helius.blocks.current();

            throwIfErrorAndDatadog(blockhashResponse, {
                datadogMetric: "api.submit_withdrawal_v2.err",
                datadogTags: { type: "blockhash_not_founder" },
            });

            blockhash = blockhashResponse.value.blockhash;
        }

        console.log("jito bundle");
        const signatureResponse = await solana.submitInitial(
            rawTransaction,
            blockhash,
            true
        );
        console.log("jito bundle sent");

        throwIfErrorAndDatadog(signatureResponse, {
            datadogMetric: "api.submit_withdrawal_v2.err",
            datadogTags: { type: "no_signature" },
        });

        const signature = signatureResponse.value;

        const withdrawalResponse = await withdrawalRepo.create({
            hash: signature,
            kadoOrderId: kadoOrderId ?? null,
            status: WithdrawalStatus.Pending,
            failedReason: null,
            amount: new BigNumber(0),
            chain: chain,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
        });

        throwIfErrorAndDatadog(withdrawalResponse, {
            logToSlack: true, // urgent
            slackMessage: [
                `User: ${user.email} (${user.id})`,
                `Withdrawal failed ${signature}`,
            ].join("\n"),
            datadogMetric: "api.submit_withdrawal_v2.err",
            datadogTags: { type: "withdrawal_created" },
        });

        const withdrawal = withdrawalResponse.value;

        const data: SubmitWithdrawalData = {
            withdrawalId: withdrawalResponse.value.id,
            userId: user.id,
            blockHeight,
            chain: withdrawal.chain,
            signature: signature,
            rawTransaction,
        };

        await sendToInngest(async () => {
            await inngest.send({
                name: InngestEventName.SubmitWithdrawal,
                data,
            });
        });

        void Slack.send({
            channel: SlackChannel.LogsWithdrawals,
            format: true,
            message: [
                `Withdrawal Transaction Submitted 🛫\n`,
                `User: ${user.email} (${user.id})`,
                `Withdrawal: ${withdrawal.id}`,
                `Chain: ${chain}`,
                `Blockheight: ${blockHeight}`,
                `Signature: ${signature} (${
                    BlockExplorerService.getBlockExplorerInfo(
                        withdrawal.chain,
                        withdrawal.hash || ""
                    )?.url
                })`,
            ].join("\n"),
        });

        Datadog.increment("api.submit_withdrawal_v2.ok", 1, { chain });

        return withdrawal;
    },
});
