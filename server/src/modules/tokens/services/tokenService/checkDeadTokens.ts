import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";
import { find } from "./find";
import { LessThan, IsNull } from "typeorm";
import { isDeadToken } from "./isDeadToken";
import _ = require("lodash");
import { TokenService } from "./tokenService";
import { Token } from "src/core/infra/postgres/entities";
import { Slack, SlackChannel } from "src/utils";
import { DateTime } from "luxon";
import { IsDeadStatus } from "src/core/infra/postgres/entities/Token";

const NUM_DEAD_TOKENS_TO_CHECK = 100; // 1000 was too many

export const checkDeadTokens = async (): Promise<
    FailureOrSuccess<DefaultErrors, null>
> => {
    const twoWeeksAgo = DateTime.now().minus({ weeks: 1 }).toJSDate();

    // get potentially dead tokens
    const tokensResp = await find({
        where: {
            isDead: IsNull(),
            createdAt: LessThan(twoWeeksAgo),
        },
        take: NUM_DEAD_TOKENS_TO_CHECK,
    });
    if (tokensResp.isFailure()) return failure(tokensResp.error);
    const tokens = tokensResp.value;

    const helperResp = await checkDeadTokensHelper(tokens);
    return helperResp;
};

export const checkDeadTokensHelper = async (
    tokens: Token[]
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    if (tokens.length === 0) return success(null);

    // check if each of them are dead
    let count = 0;
    for (const token of tokens) {
        // if (count % 100 === 0)
        //     console.log("Count: ", count);
        const isDeadResp = await isDeadToken(token);
        if (isDeadResp.isFailure()) {
            await Slack.send({
                channel: SlackChannel.TradingUrgent,
                message: `Error checking if token is dead (${token.contractAddress}): ${isDeadResp.error.message}`,
            });
            return failure(isDeadResp.error);
        }
        const isDead = isDeadResp.value;

        token.isDead = isDead === IsDeadStatus.Alive ? false : true;
        token.isDeadEnum = isDead;
        count += 1;
        // token.lastCheckedIsDeadUnixStr = String(new Date().getTime());
    }

    // save tokens in chunks
    for (const chunk of _.chunk(tokens, 250)) {
        const saveResp = await TokenService.saveMany(chunk);
        if (saveResp.isFailure()) return failure(saveResp.error);
    }

    return success(null);
};
