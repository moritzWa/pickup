import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { TokenSecurityData } from "../../types";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { birdeye } from "src/utils/birdeye";
import { TokenSecurityCacheService } from "./tokenSecurityCacheService";

const PROVIDER = AccountProvider.Solana;

export const getTokenSecurity = async (
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, TokenSecurityData>> => {
    // // get cache
    // const cacheResp = await TokenSecurityCacheService.fetch({
    //     provider: PROVIDER,
    //     contractAddress,
    // });
    // if (cacheResp.isFailure()) return failure(cacheResp.error);
    // if (cacheResp.value) return success(cacheResp.value.data);

    // birdeye
    const birdeyeResp = await birdeye.getTokenSecurity(
        PROVIDER,
        contractAddress,
        true,
        "solana > getTokenSecurity()"
    );
    if (birdeyeResp.isFailure()) return failure(birdeyeResp.error);

    // set cache
    await TokenSecurityCacheService.set({
        provider: PROVIDER,
        contractAddress,
        data: birdeyeResp.value,
    });

    // return
    return birdeyeResp;
};
