import BigNumber from "bignumber.js";
import { enumType, nonNull, nullable, objectType } from "nexus";
import { sum } from "radash";
import {
    User as UserModel,
    UserAuthProvider,
    UserStatus,
} from "src/core/infra/postgres/entities/User";
import * as crypto from "crypto";
import { Maybe } from "src/core/logic";
import { config } from "src/config";
import { SwapStatus, SwapType } from "src/core/infra/postgres/entities/Trading";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import {
    NexusGenEnums,
    NexusGenObjects,
} from "src/core/surfaces/graphql/generated/nexus";
import { SwapPrivacy } from "src/core/infra/postgres/entities";

export const SwapStatusEnum = enumType({
    name: "SwapStatusEnum",
    members: SwapStatus,
});

export const SwapPrivacyEnum = enumType({
    name: "SwapPrivacyEnum",
    members: SwapPrivacy,
});

export const SwapTypeEnum = enumType({
    name: "SwapTypeEnum",
    members: SwapType,
});

export const Swap = objectType({
    name: "Swap",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("hash");
        t.field("type", { type: nonNull("SwapTypeEnum") });
        t.field("chain", { type: nonNull("AccountProviderEnum") });
        t.field("status", {
            type: nonNull("SwapStatusEnum"),
        });
        t.nonNull.string("sendTokenContractAddress");
        t.nonNull.string("sendSymbol");
        t.nonNull.string("receiveSymbol");
        t.nonNull.string("receiveTokenContractAddress");
        t.nullable.string("failedReason");
        t.field("blockExplorerUrl", {
            type: nullable("String"),
            resolve: (p) =>
                BlockExplorerService.getBlockExplorerInfo(p.chain, p.hash)
                    ?.url ?? null,
        });
        t.field("blockExplorerName", {
            type: nullable("String"),
            resolve: (p) =>
                BlockExplorerService.getBlockExplorerInfo(p.chain, p.hash)
                    ?.name ?? null,
        });
        t.nonNull.string("createdAt");
    },
});

export const SWAP_STATUS_TO_DOMAIN: Record<
    NexusGenEnums["SwapStatusEnum"],
    SwapStatus
> = {
    confirmed: SwapStatus.Confirmed,
    processed: SwapStatus.Processed,
    pending: SwapStatus.Pending,
    finalized: SwapStatus.Finalized,
    failed: SwapStatus.Failed,
};

export const SWAP_PRIVACY_TO_DOMAIN: Record<
    NexusGenEnums["SwapPrivacyEnum"],
    SwapPrivacy
> = {
    private: SwapPrivacy.Private,
    public: SwapPrivacy.Public,
    following: SwapPrivacy.Following,
};

export const SWAP_TYPE_TO_DOMAIN: Record<
    NexusGenEnums["SwapTypeEnum"],
    SwapType
> = {
    buy: SwapType.Buy,
    sell: SwapType.Sell,
    unknown: SwapType.Unknown,
};
