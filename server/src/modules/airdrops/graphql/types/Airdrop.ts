import BigNumber from "bignumber.js";
import { objectType } from "nexus";
import {
    AirdropClaimService,
    INVITER_MULTIPLIER,
} from "../../services/airdropClaimService";

export const Airdrop = objectType({
    name: "Airdrop",
    definition: (t) => {
        t.nonNull.id("id");
        t.nonNull.string("iconImageUrl");
        t.nonNull.string("symbol");
        t.nonNull.float("inviterAmount", {
            resolve: (t) => AirdropClaimService.getInviterAmount(t),
        });
        t.nonNull.float("invitedAmount", {
            resolve: (t) => AirdropClaimService.getInvitedAmount(t),
        });
        t.nonNull.float("amountPerClaim");
        t.nonNull.date("startDate");
        t.nonNull.date("endDate");
        t.nullable.boolean("hasClaimed");
    },
});
