export default null;

// This was before we had the DB table for blacklist

// import {
//     DefaultErrors,
//     FailureOrSuccess,
//     Maybe,
//     UnexpectedError,
//     failure,
//     success,
// } from "src/core/logic";
// import { redisPersisted } from "src/utils/cache";
// import { Helpers } from "src/utils";
// import { TokenService } from "src/modules/tokens/services/tokenService";
// import { AccountProvider } from "src/core/infra/postgres/entities";

// const CURRENT_SCHEMA = "2024-03-19";

// type BlacklistedAsset = {
//     contractAddress: string;
//     provider: AccountProvider;
//     name: string;
//     symbol: string;
//     coingeckoTokenId: Maybe<string>;
// };

// type CachedBlacklist = {
//     // schema: string; <- don't want this because we don't want to wipe entire blacklist if it's different
//     blacklistedAssets: BlacklistedAsset[];
// };

// const getKey = (): string => `blacklist_persistent_cache:v1`;

// const fetch = async (): Promise<
//     FailureOrSuccess<DefaultErrors, Maybe<CachedBlacklist>>
// > => {
//     try {
//         const key = getKey();
//         const result = await redisPersisted.get(key);
//         if (!result) return success(null);
//         const parseResult = Helpers.maybeParseJSON<CachedBlacklist>(result);
//         if (parseResult.isFailure() || !parseResult.value)
//             // might need to check parseResult.value.data, idk
//             return failure(new Error("Could not parse for key: " + key));

//         return success(parseResult.value as CachedBlacklist);
//     } catch (e) {
//         // does not exist or could not parse
//         console.error(e);
//         return failure(new UnexpectedError(e));
//     }
// };

// // // We never want to wipe the blacklist, so we don't want this function available ever
// // const wipe = async (): Promise<FailureOrSuccess<DefaultErrors, null>> => {
// //     try {
// //         const key = getKey();
// //         const del = await redisPersisted.del(key);
// //         return success(null);
// //     } catch (e) {
// //         // does not exist or could not parse
// //         console.error(e);
// //         return failure(new UnexpectedError(e));
// //     }
// // };

// const _addOrRemoveAsset = async (
//     asset: BlacklistedAsset,
//     type: "add" | "remove"
// ): Promise<FailureOrSuccess<DefaultErrors, CachedBlacklist>> => {
//     try {
//         const key = getKey();

//         // fetch blacklist
//         const fetchResult = await fetch();
//         if (fetchResult.isFailure()) return failure(fetchResult.error);

//         // add asset if it doesn't exist
//         const blacklistedAssets =
//             fetchResult.value?.blacklistedAssets.filter(
//                 (a) => TokenService.isSameToken(a, asset) === false
//             ) || [];
//         if (type === "add") {
//             blacklistedAssets.push(asset);
//         }

//         const toCache: CachedBlacklist = {
//             blacklistedAssets,
//         };
//         const cacheData = Helpers.maybeStringifyJSON(toCache);
//         if (cacheData.isFailure()) return failure(cacheData.error);
//         const setResponse = await redisPersisted.set(key, cacheData.value);
//         console.log(type + "ed asset");
//         return success(toCache);
//     } catch (e) {
//         console.error(e);
//         return failure(new UnexpectedError(e));
//     }
// };

// // see scripts for how we set cache
// const addAsset = async (
//     asset: BlacklistedAsset
// ): Promise<FailureOrSuccess<DefaultErrors, CachedBlacklist>> =>
//     await _addOrRemoveAsset(asset, "add");

// // see scripts for how we set cache
// const removeAsset = async (
//     asset: BlacklistedAsset
// ): Promise<FailureOrSuccess<DefaultErrors, CachedBlacklist>> =>
//     await _addOrRemoveAsset(asset, "remove");

// const empty = (): CachedBlacklist => ({ blacklistedAssets: [] });

// const toSet = (data: CachedBlacklist): Set<string> =>
//     new Set(
//         data.blacklistedAssets.map((a) =>
//             TokenService.buildKey(a.provider, a.contractAddress)
//         )
//     );

// export const BlacklistService = {
//     CURRENT_SCHEMA,
//     getKey,
//     fetch,
//     empty,
//     addAsset,
//     removeAsset,
//     toSet,
// };
