import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { QuoteTradingFee as QuoteTradingFeeT } from "src/core/infra/postgres/entities/Trading/Quote";
import { SOL_USDC_MINT } from "src/shared/integrations/providers/solana/constants";

export const QuoteFee = objectType({
    name: "QuoteFee",
    definition(t) {
        t.nonNull.float("feeAmountCents", {
            // if it is a big number, convert it
            resolve: (parent) =>
                new BigNumber(
                    (parent as QuoteTradingFeeT).feeFiatAmountCents
                ).toNumber(),
        });
        t.nonNull.string("feeName", { resolve: (t) => "Token Account Fee" });
        t.nonNull.string("symbol", {
            resolve: (parent) => (parent as QuoteTradingFeeT).symbol || "USDC",
        });
        t.nonNull.string("tokenContractAddress");
        t.nonNull.float("amount", {
            // if it is a big number, convert it
            resolve: (parent) =>
                new BigNumber((parent as QuoteTradingFeeT).amount).toNumber(),
        });

        t.nullable.string("message", {
            // if it is a big number, convert it
            resolve: (parent) => {
                if (parent.tokenContractAddress === SOL_USDC_MINT) {
                    return "We only charge this fee the first time you purchase this token. Every other trade for this token will not include this fee.";
                }

                return null;
            },
        });
    },
});

export const Quote = objectType({
    name: "Quote",
    definition(t) {
        t.nonNull.id("id");
        t.field("chain", { type: nonNull("AccountProviderEnum") });
        t.field("provider", {
            type: nonNull("TradingProviderEnum"),
        });
        t.nullable.field("fees", {
            type: nullable(list(nonNull("QuoteFee"))),
        });
        t.nullable.string("providerImageUrl");
        t.nullable.string("sendSymbol");
        t.nullable.string("sendIconImageUrl");
        t.nullable.string("receiveSymbol");
        t.nullable.string("receiveIconImageUrl");
        t.nonNull.field("sendAmount", { type: nonNull("Float") });
        t.nonNull.field("receiveAmount", { type: nonNull("Float") });
        t.nullable.float("recommendedSlippageBps", {
            resolve: (parent) => parent.recommendedSlippageBps,
        });
        t.nonNull.field("sendFiatAmountCents", {
            type: nonNull("Float"),
        });
        t.nonNull.field("receiveFiatAmountCents", {
            type: nonNull("Float"),
        });
        t.nonNull.field("sendFiatCurrency", {
            type: nonNull("String"),
        });
        t.nonNull.field("receiveFiatCurrency", {
            type: nonNull("String"),
        });
    },
});
