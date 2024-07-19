import { enumType, objectType } from "nexus";
import { Blockchain } from "src/shared/domain/blockchain";

export const BlockchainEnum = enumType({
    name: "BlockchainEnum",
    members: Blockchain,
});
