import {
    ObjectWithObjectID,
    SearchResponse,
    BrowseOptions,
    FacetHit,
    SearchOptions,
} from "@algolia/client-search";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    failureAndLog,
    success,
} from "src/core/logic";
import { AlgoliaIndexType } from "./types";

export class AlgoliaIndexClass<
    ReturnType extends Readonly<Record<string, any>>
> {
    private index: AlgoliaIndexType;

    constructor(private _index: AlgoliaIndexType) {
        this.index = _index;
    }

    get getIndex() {
        return this.index;
    }

    public save = async (rows: ReturnType[]) => {
        try {
            const res = await this.index.saveObjects(rows);
        } catch (err) {
            console.error(err);
        }
    };

    public search = async (
        search: string,
        requestOptions?: SearchOptions | undefined
    ): Promise<FailureOrSuccess<DefaultErrors, SearchResponse<ReturnType>>> => {
        try {
            const res = await this.index.search<ReturnType>(
                search,
                requestOptions
            );

            return success(res);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };

    public searchByField = async (
        facet: string,
        search: string
    ): Promise<FailureOrSuccess<DefaultErrors, FacetHit[]>> => {
        try {
            const results = await this.index.searchForFacetValues(
                facet,
                search
            );

            return success(results.facetHits);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };

    public browseObjects = async (
        opts: BrowseOptions<ReturnType>
    ): Promise<FailureOrSuccess<DefaultErrors, void>> => {
        try {
            const res = await this.index.browseObjects<ReturnType>(opts);
            return success(res);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };

    public searchIds = async (
        ids: string[]
    ): Promise<FailureOrSuccess<DefaultErrors, SearchResponse<ReturnType>>> => {
        try {
            const res = await this.index.search<ReturnType>("", {
                facetFilters: [ids.map((id) => `objectID:${id}`)],
            });

            return success(res);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };

    public fetchAll = async (): Promise<
        FailureOrSuccess<DefaultErrors, ReturnType[]>
    > => {
        const results: ReturnType[] = [];
        const indexResp = await this.browseObjects({
            batch: (batch) => {
                results.push(...batch);
            },
        });
        if (indexResp.isFailure()) {
            return failureAndLog({
                error: indexResp.error,
                message: `Should never happen: Failed to fetch entries from algolia: ${indexResp.error}`,
            });
        }
        return success(results);
    };

    public browse = async (): Promise<
        FailureOrSuccess<DefaultErrors, ObjectWithObjectID[]>
    > => {
        try {
            let hits: ObjectWithObjectID[] = [];

            // Get all records as an iterator
            await this.index.browseObjects({
                batch: (batch) => {
                    hits = hits.concat(batch);
                },
                hitsPerPage: 10_000,
            });

            return success(hits);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };
}
