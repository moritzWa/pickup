import { AccountProvider } from "src/core/infra/postgres/entities/types";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

// The `server.ts` file on the frontend should be IDENTICAL to the `web.ts` file on the backend.
export const COGS_ACCOUNT_NAME = "Cost of Goods Sold";
export const INVESTMENTS_ACCOUNT_NAME = "Investments";

export const ACCOUNT_PROVIDER_GQL_TO_DOMAIN: Record<
    NexusGenEnums["AccountProviderEnum"],
    AccountProvider
> = {
    solana: AccountProvider.Solana,
};
