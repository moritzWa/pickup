import { list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { transactionRepo } from "../../infra";
import { SyncTransactionsService } from "../../services";
import { StatusCodes } from "http-status-codes";
import { FindOptionsWhere } from "typeorm";
import { Transaction } from "src/core/infra/postgres/entities";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";

export const getTransactions = queryField("getTransactions", {
    type: nonNull(list(nonNull("Transaction"))),
    args: {
        limit: nullable("Int"),
        page: nullable("Int"),
        tokenContractAddress: nullable("String"),
        provider: nullable("AccountProviderEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const issuer = user.magicIssuer;
        let { page, limit } = args;

        if (!limit) {
            limit = 25;
        }

        if (!page) {
            page = 0;
        }

        if (limit > 100) {
            throw new ApolloError(
                "Limit cannot be greater than 100",
                StatusCodes.BAD_REQUEST.toString()
            );
        }

        // not the best -> just doing it for now
        void SyncTransactionsService.syncTransactions(user);

        const offset = page * limit;
        const provider = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[args.provider || ""];

        if (args.tokenContractAddress && provider) {
            const resultsResponse = await transactionRepo.findForUserForToken(
                user.id,
                args.tokenContractAddress,
                provider,
                {
                    skip: offset,
                    take: limit,
                }
            );

            throwIfError(resultsResponse);

            return resultsResponse.value;
        }

        const txnsResponse = await transactionRepo.findForUser(user.id, {
            order: {
                createdAt: "desc",
            },
            relations: {
                transfers: true,
            },
            take: limit,
            skip: offset,
        });

        throwIfError(txnsResponse);

        const txns = txnsResponse.value;

        return txns;
    },
});
