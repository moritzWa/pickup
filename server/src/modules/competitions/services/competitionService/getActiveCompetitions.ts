import { AccountProvider, Competition } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { pgCompetitionRepo } from "../../infra";
import { FullCompetition } from "./FullCompetition";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { keyBy } from "lodash";
import { In } from "typeorm";
import { birdeye } from "src/utils/birdeye";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { MarketCapVolumeService } from "src/modules/tokens/services/marketCapVolumeService";
import {
    NexusGenEnums,
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { CompetitionTokenData } from "./CompetitionTokenData";
import { TOKEN_OVERRIDES } from "src/shared/integrations/providers/solana/contracts";
import { DiscoveryResultType } from "src/modules/discovery/graphql";
import { formatPrice } from "src/modules/discovery/services/discoveryService/providers/solana/utils";

export const getActiveCompetitions = async (): Promise<
    FailureOrSuccess<DefaultErrors, FullCompetition[]>
> => {
    // get competitions
    const competitionsResp = await pgCompetitionRepo.find({
        // where: {
        //     isActive: true,
        // },
    });
    if (competitionsResp.isFailure()) {
        return failure(competitionsResp.error);
    }
    const competitions = competitionsResp.value;

    // get tokens
    const tokensResp = await TokenService.find({
        where: {
            id: In(competitions.map((t) => [t.token1Id, t.token2Id]).flat()),
        },
    });
    if (tokensResp.isFailure()) return failure(tokensResp.error);
    const tokens = tokensResp.value;
    const tokenByAddress = keyBy(tokens, (t) => t.contractAddress);

    // get prices
    const addresses = tokens
        .map((token) => token.contractAddress)
        .filter(hasValue);

    // prices & missing metadata
    const [_pricesResponse, metadatasResponse, marketCapResponse] =
        await Promise.all([
            birdeye.getMultiPrice(addresses),
            TokenMetadataService.getTokenMetadatas(
                addresses.map((a) => ({
                    provider: AccountProvider.Solana,
                    contractAddress: a,
                }))
            ),
            MarketCapVolumeService.getMarketCapAndVolume(tokens),
        ]);

    if (metadatasResponse.isFailure()) return failure(metadatasResponse.error);

    const marketCapMapping = marketCapResponse.isSuccess()
        ? keyBy(marketCapResponse.value, (t) => t.contractAddress)
        : {};

    const metadatas = metadatasResponse.value;
    const metadatasObj = keyBy(metadatas, "contractAddress");

    // merge prices
    const prices = _pricesResponse.isSuccess() ? _pricesResponse.value : {};

    const t = addresses
        .map((t): Maybe<NexusGenObjects["TokenData"]> => {
            const priceData = prices[t];
            const marketCap = marketCapMapping[t];

            const token = tokenByAddress[t];
            const metadata = metadatasObj[t];

            if (!priceData || !metadata) return null;

            return {
                id: token.id,
                marketCap: marketCap?.marketCap,
                vol24h: marketCap?.vol24h,
                priceFormatted: formatPrice(priceData.value),
                priceChangePercentage24h: priceData.priceChange24h,
                priceChangePercentage24hFormatted: priceData.priceChange24h
                    ? `${priceData.priceChange24h.toFixed(2)}%`
                    : null,
                contractAddress: t,
                provider: AccountProvider.Solana,
                name: token?.name || metadata.name || "",
                symbol: token?.symbol || metadata.symbol || "",
                iconImageUrl:
                    token?.iconImageUrl || metadata.iconImageUrl || "",
                isStrict: token.isStrict,
                isMovementVerified: token.isMovementVerified,
                isClaimed: token.isClaimed,
            };
        })
        .filter(hasValue);

    // merge with competitions
    const decoratedCompetitions: FullCompetition[] = competitions
        .map((competition) => {
            const token1 = t.find((t) => t.id === competition.token1Id);
            const token2 = t.find((t) => t.id === competition.token2Id);

            if (!token1 || !token2) {
                return null;
            }

            return {
                ...competition,
                token1,
                token2,
            };
        })
        .filter(hasValue);

    return success(decoratedCompetitions);
};
