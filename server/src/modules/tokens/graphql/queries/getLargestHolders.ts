import {
    idArg,
    list,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Helpers, helius } from "src/utils";
import { ApolloError } from "apollo-server-errors";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BigNumber from "bignumber.js";

export const getLargestHolders = queryField("getLargestHolders", {
    type: nonNull(list(nonNull("LargestHolder"))),
    args: {
        mintAddress: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { mintAddress } = args;

        // get helius
        const [mintResp, holdersResp] = await Promise.all([
            helius.mint.getMint(mintAddress),
            helius.tokens.getTokenLargestAccounts(mintAddress),
        ]);
        throwIfError(mintResp);
        throwIfError(holdersResp);
        const mint = mintResp.value;
        const holders = holdersResp.value.value.slice(0, 10);

        const supply = mint.supply;

        // get accounts for holders
        const accountsResp = await Promise.all(
            holders.map((holder) => {
                return helius.tokens.getTokenAccount(
                    holder.address.toString(),
                    TOKEN_PROGRAM_ID.toString()
                );
            })
        );
        if (accountsResp.some((resp) => resp.isFailure()))
            throw new ApolloError("Failed to get accounts for holders");
        const accounts = accountsResp.map((resp) => resp.value);
        const accountsByKey = accounts.reduce((acc, account) => {
            acc[account.address.toString()] = account;
            return acc;
        });

        const resp = holders.map((holder) => {
            return {
                tokenAccountKey: holder.address.toString(),
                accountKey:
                    accountsByKey[
                        holder.address.toString()
                    ]?.owner?.toString() || "",
                amount: holder.amount,
                percentage: new BigNumber(holder.amount)
                    .div(new BigNumber(supply.toString()))
                    .toNumber(),
            };
        });

        return resp;
    },
});
