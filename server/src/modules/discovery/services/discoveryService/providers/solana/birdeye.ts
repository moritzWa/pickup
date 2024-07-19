export default null;
// import { AccountProvider } from "src/core/infra/postgres/entities";
// import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
// import { throwIfError } from "src/core/surfaces/graphql/common";
// import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
// import { DiscoveryResultType } from "src/modules/discovery/graphql";
// import { birdeye } from "src/utils/birdeye";
// import { formatPrice } from "./utils";

// export const getTokens = async (): Promise<
//     FailureOrSuccess<
//         DefaultErrors,
//         NexusGenObjects["GetDiscoverySplashResponse"]
//     >
// > => {
//     // trending
//     const tokenListResponse = await birdeye.getTokenList();
//     throwIfError(tokenListResponse);
//     const tokenList = tokenListResponse.value;
//     const tokens = tokenList.tokens
//         .map((t): NexusGenObjects["DiscoverySplashResult"] => ({
//             coinGeckoTokenId: null,
//             contractAddress: t.address,
//             iconImageUrl: t.logoURI,
//             name: t.name,
//             provider: AccountProvider.Solana,
//             symbol: t.symbol,
//             type: DiscoveryResultType.FungibleToken,
//             priceChangePercentage24h: t.v24hChangePercent,
//             priceChangePercentage24hFormatted:
//                 t.v24hChangePercent !== null
//                     ? `${t.v24hChangePercent.toFixed(2)}%`
//                     : null,
//             priceFormatted: null,
//         }))
//         .filter((t) => t.symbol && t.name); // otherwise shows as empty row
//     const addresses = tokens.map((t) => t.contractAddress);

//     // prices
//     const pricesResponse = await birdeye.getMultiPrice(addresses);
//     throwIfError(pricesResponse);
//     const prices = pricesResponse.value;
//     tokens.forEach((t) => {
//         const priceData = prices[t.contractAddress];
//         if (priceData) {
//             t.priceFormatted = formatPrice(priceData.value);
//         }
//     });

//     return success({
//         results: tokens,
//     });
// };
