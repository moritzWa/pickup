import { dataSource } from "src/core/infra/postgres";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { VoteService } from ".";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { Token } from "src/core/infra/postgres/entities";

export const _changeNumVotes = async (
    tokenId: string,
    amount: number
): Promise<FailureOrSuccess<DefaultErrors, Token>> => {
    try {
        return await dataSource.manager.transaction(async (dbTxn) => {
            // get token and lock table
            const tokenResp = await TokenService.findOne({
                where: {
                    id: tokenId,
                },
            });
            if (tokenResp.isFailure()) throw new Error(tokenResp.error.message);
            const token = tokenResp.value;

            // update the number of votes
            const updateResp = await TokenService.update(
                token.id,
                {
                    numVotes: token.numVotes + amount,
                },
                dbTxn
            );
            if (updateResp.isFailure())
                throw new Error(updateResp.error.message);
            const vote = updateResp.value;

            // return vote
            return success(vote);
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
