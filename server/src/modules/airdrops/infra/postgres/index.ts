import { Airdrop, AirdropClaim } from "src/core/infra/postgres/entities";
import { PostgresAirdropRepository } from "./airdropRepo";
import { PostgresAirdropClaimRepository } from "./airdropClaimRepo";

export const airdropRepo = new PostgresAirdropRepository(Airdrop);
export const airdropClaimRepo = new PostgresAirdropClaimRepository(
    AirdropClaim
);
