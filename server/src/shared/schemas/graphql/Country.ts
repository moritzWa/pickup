import { enumType } from "nexus";
import { Country } from "src/core/infra/postgres/entities/types";

export const CountryEnum = enumType({
    name: "CountryEnum",
    members: Country,
});
