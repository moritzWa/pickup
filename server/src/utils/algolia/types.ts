import algoliasearch from "algoliasearch";
import { config } from "src/config";

// index type
const client = algoliasearch(config.algolia.appId, config.algolia.apiKey);
const fakeIndex = client.initIndex("");
export type AlgoliaIndexType = typeof fakeIndex;
