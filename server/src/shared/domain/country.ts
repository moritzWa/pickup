import { Country } from "src/core/infra/postgres/entities/types";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";
import { UserType } from "src/modules/users/services";

export type GQLCountryEnum = NexusGenEnums["CountryEnum"];

export const COUNTRY_GQL_TO_DOMAIN: Record<GQLCountryEnum, Country> = {
    US: Country.US,
    CA: Country.CA,
    UK: Country.UK,
    AU: Country.AU,
};

export const CountryMapping = {
    fromGQL: (a: GQLCountryEnum) => COUNTRY_GQL_TO_DOMAIN[a],
};
