import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { SolanaDiscoveryProvider } from "./providers/solana/solana";
import {
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { isValidSolanaAddress } from "src/shared/integrations/providers/solana/utils";
import { DiscoverySplashCacheService } from "../discoverySplashCache";
import { Slack, SlackChannel, logHistogram } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { DiscoveryResultType } from "../../graphql";
import { formatPrice } from "./providers/solana/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { In } from "typeorm";
import { keyBy } from "lodash";
import { CategoryEntryService } from "src/modules/categories/services";
import { Category } from "src/core/infra/postgres/entities/Token";

type BlueChip = {
    contractAddress: string;
    symbol: string;
    name: string;
    iconImageUrl: string;
    provider: AccountProvider;
};

export const getBlueChips = async (): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenRootTypes["DiscoverySplashResult"][]
    >
> => {
    // INFLUENCERS
    const influencersResp = await CategoryEntryService.getCategoryTokens(
        Category.Celebrities
    );
    if (influencersResp.isFailure()) return failure(influencersResp.error);
    const influencers = influencersResp.value;

    // sort
    influencers.tokens.sort((a, b) =>
        hasValue(a.marketCap) &&
        hasValue(b.marketCap) &&
        !isNaN(Number(a.marketCap)) &&
        !isNaN(Number(b.marketCap))
            ? Number(b.marketCap) - Number(a.marketCap)
            : 0
    );

    return success(influencers.tokens);

    // BLUE CHIPS
    // // get prices
    // const addresses = BLUE_CHIPS.map((blueChip) => blueChip.contractAddress);

    // const _pricesResp = await birdeye.getMultiPrice(addresses);

    // // if (pricesResp.isFailure()) return failure(pricesResp.error);

    // const prices = _pricesResp.isSuccess() ? _pricesResp.value : {};

    // // get tokens
    // const tokensResp = await TokenService.find({
    //     where: {
    //         contractAddress: In(addresses),
    //         provider: AccountProvider.Solana,
    //     },
    // });

    // if (tokensResp.isFailure()) {
    //     return failure(tokensResp.error);
    // }

    // const tokens = tokensResp.value;

    // const tokensMap = keyBy(tokens, (token) =>
    //     TokenService.buildKey(AccountProvider.Solana, token.contractAddress)
    // );

    // // merge prices
    // const blueChipsWithPrices = BLUE_CHIPS.map((blueChip) => {
    //     const price = prices[blueChip.contractAddress];
    //     const token =
    //         tokensMap[
    //             TokenService.buildKey(
    //                 AccountProvider.Solana,
    //                 blueChip.contractAddress
    //             )
    //         ];
    //     if (!token) return null;
    //     return {
    //         ...blueChip,
    //         iconImageUrl: token.iconImageUrl ?? blueChip.iconImageUrl,
    //         id: token.id,
    //         priceFormatted: formatPrice(price.value),
    //         priceChangePercentage24h: price.priceChange24h,
    //         priceChangePercentage24hFormatted: price.priceChange24h
    //             ? `${price.priceChange24h.toFixed(2)}%`
    //             : null,
    //         type: DiscoveryResultType.FungibleToken,
    //         isClaimed: token.isClaimed ?? null,
    //         isMovementVerified: token.isMovementVerified ?? null,
    //         isStrict: token.isStrict ?? null,
    //     };
    // }).filter(hasValue);

    // return success(blueChipsWithPrices);
};
