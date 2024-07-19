import { enumType, nonNull, nullable, objectType } from "nexus";
import {
    TokenWarningReason,
    TokenWarningSeverity,
} from "../../services/getTokenWarning";

export const TokenWarningReasonEnum = enumType({
    name: "TokenWarningReasonEnum",
    members: TokenWarningReason,
});

export const TokenWarningSeverityEnum = enumType({
    name: "TokenWarningSeverityEnum",
    members: TokenWarningSeverity,
});

export const TokenWarning = objectType({
    name: "TokenWarning",
    definition: (t) => {
        t.field("reason", { type: nonNull(TokenWarningReasonEnum) });
        t.field("severity", { type: nonNull(TokenWarningSeverityEnum) });
        t.string("message");
    },
});

export const TokenInfo = objectType({
    name: "TokenInfo",
    definition(t) {
        t.nonNull.string("symbol");
        t.nonNull.string("name");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("contractAddress");
        t.nullable.string("coingeckoId");
        t.nullable.boolean("isStrict");
        t.nullable.boolean("isMovementVerified");
        t.nullable.boolean("isClaimed");
        t.nullable.id("tokenId");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
        t.field("warning", { type: nullable("TokenWarning") });
    },
});
