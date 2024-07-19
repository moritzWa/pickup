import { enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export enum DiscoveryResultType {
    NFT = "NFT",
    FungibleToken = "FungibleToken",
}

export const DiscoveryResultTypeEnum = enumType({
    name: "DiscoveryResultTypeEnum",
    members: DiscoveryResultType,
});
