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

export const voteForToken = async (
    tokenId: string,
    userId: string
): Promise<FailureOrSuccess<DefaultErrors, Token>> => {
    // update your vote
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
            if (vote) {
                if (vote.isUndone === false)
                    throw new Error("You already voted for this token.");
                // vote is undone, so redo it
                vote.isUndone = false;
                const saveResp = await VoteService.save(vote, dbTxn);
                if (saveResp.isFailure())
                    throw new Error(saveResp.error.message);
            } else {
                // create new vote
                const createResp = await VoteService.save(
                    {
                        tokenId,
                        userId,
                        isUndone: false,
                    },
                    dbTxn
                );
                if (createResp.isFailure())
                    throw new Error(createResp.error.message);
            }
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }

    // update num votes
    return await _changeNumVotes(tokenId, 1);
};
