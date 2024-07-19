import { enumType } from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { CostBasisAlgorithm } from "src/shared/domain";

export * from "./Blockchain";
export * from "./Currency";
export * from "./Country";

export const CostBasisAlgorithmEnum = enumType({
    name: "CostBasisAlgorithmEnum",
    members: CostBasisAlgorithm,
});

export const AccountProviderEnum = enumType({
    name: "AccountProviderEnum",
    members: AccountProvider,
});
