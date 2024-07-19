import { enumType } from "nexus";
import { CurrencyCode } from "src/shared/domain";

export const CurrencyCodeEnum = enumType({
    name: "CurrencyCodeEnum",
    members: CurrencyCode,
});
