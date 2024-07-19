import { Token } from "src/core/infra/postgres/entities";
import { IsDeadStatus } from "src/core/infra/postgres/entities/Token";
import {
    DefaultErrors,
    Maybe,
    failure,
    success,
    FailureOrSuccess,
} from "src/core/logic";
import { birdeye } from "src/utils/birdeye";

export const isDeadToken = async (
    token: Token
): Promise<FailureOrSuccess<DefaultErrors, IsDeadStatus>> => {
    // get volume from birdeye
    const volumeResp = await birdeye.getTokenOverview(
        token.provider,
        token.contractAddress,
        false,
        "isDeadToken()"
    );
    if (volumeResp.isFailure()) {
        return success(IsDeadStatus.Inconclusive);
        // return failure(volumeResp.error);
    }
    const volume = volumeResp.value.data.v24hUSD;

    // if volume is 0, token is dead
    if (volume === 0) return success(IsDeadStatus.Dead);
    else return success(IsDeadStatus.Alive);
};
