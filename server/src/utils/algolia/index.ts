import {
    ObjectWithObjectID,
    SearchResponse,
    BrowseOptions,
    FacetHit,
    SearchOptions,
    SearchIndex,
} from "@algolia/client-search";
import algoliasearch from "algoliasearch";
import { config, isProduction } from "src/config";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    failureAndLog,
    success,
} from "src/core/logic";
import { JupTokenWithStrictTag } from "src/modules/discovery/services/discoveryService/providers/solana/jupiter";
import { CategoryEntry, Token } from "src/core/infra/postgres/entities";
import { AlgoliaIndexClass } from "./algoliaIndexClass";
import { CategoryMetadata } from "src/core/infra/postgres/entities/Token";

const client = algoliasearch(config.algolia.appId, config.algolia.apiKey);

// tokens
export type AlgoliaToken = Pick<
    Token,
    | "symbol"
    | "name"
    | "vol24h"
    | "isStrict"
    | "coingeckoId"
    | "iconImageUrl"
    | "contractAddress"
    | "fdv"
> & {
    objectID: string;
    provider: string;
    irlName: Maybe<string>;
};

const tokens = new AlgoliaIndexClass<AlgoliaToken>(
    client.initIndex(config.algolia.tokenIndex)
);

// users
export type AlgoliaUser = {
    objectID: string;
    username: string;
    name: string;
};

const users = new AlgoliaIndexClass<AlgoliaUser>(
    client.initIndex(isProduction() ? "prod_users" : "dev_users")
);

// categories
export type AlgoliaCategory = CategoryMetadata & {
    objectID: string;
};

const categories = new AlgoliaIndexClass<AlgoliaCategory>(
    client.initIndex(isProduction() ? "prod_categories" : "dev_categories")
);

export const algolia = {
    tokens,
    users,
    categories,
};
