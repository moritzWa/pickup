import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";
import { UserType } from "src/modules/users/services";

export enum Blockchain {
    Solana = "solana",
    Ethereum = "ethereum",
    Terra = "terra",
    Polygon = "polygon",
}

export type GQLBlockchainEnum = NexusGenEnums["BlockchainEnum"];

export const BLOCKCHAIN_GQL_TO_DOMAIN: Record<GQLBlockchainEnum, Blockchain> = {
    solana: Blockchain.Solana,
    ethereum: Blockchain.Ethereum,
    terra: Blockchain.Terra,
    polygon: Blockchain.Polygon,
};

export const BlockchainMapping = {
    fromGQL: (a: GQLBlockchainEnum) => BLOCKCHAIN_GQL_TO_DOMAIN[a],
};
