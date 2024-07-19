import { AccountProvider, Competition } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { pgCompetitionRepo } from "../../infra";
import { getActiveCompetitions } from "./getActiveCompetitions";
import { FullCompetition } from "./FullCompetition";

// need to make this pic the best competitions happening rn
export const getBestCompetitions = async (): Promise<
    FailureOrSuccess<DefaultErrors, FullCompetition[]>
> => {
    const competitionsResp = await getActiveCompetitions();
    if (competitionsResp.isFailure()) {
        return failure(competitionsResp.error);
    }
    const competitions = competitionsResp.value;

    return success(competitions);
};
