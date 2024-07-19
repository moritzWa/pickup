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

export const ReferralPayout = objectType({
    name: "ReferralPayout",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("createdAt");
    },
});
