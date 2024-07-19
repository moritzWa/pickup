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
import { _changeNumVotes } from "./_changeNumVotes";

export const unvoteForToken = async (
    tokenId: string,
    userId: string
): Promise<FailureOrSuccess<DefaultErrors, Token>> => {
    try {
        await dataSource.manager.transaction(async (dbTxn) => {
            // get vote
            const votesResp = await VoteService.find(
                {
                    where: {
                        tokenId,
                        userId,
                    },
                },
                dbTxn
            );
            if (votesResp.isFailure()) throw new Error(votesResp.error.message);
            const votes = votesResp.value;
            const vote = votes.length > 0 ? votes[0] : null;

            // check if vote already exists -> return null if it's true
            if (!vote || vote.isUndone === false) {
                throw new Error("You haven't voted for this token yet.");
            } else {
                // vote is undone, so redo it
                vote.isUndone = true;
                const saveResp = await VoteService.save(vote, dbTxn);
                if (saveResp.isFailure())
                    throw new Error(saveResp.error.message);
            }

            return success(vote);
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }

    // update num votes
    return await _changeNumVotes(tokenId, -1);
};
