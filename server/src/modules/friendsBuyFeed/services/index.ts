import { keyBy, uniq } from "lodash";
import { Swap, SwapPrivacy } from "src/core/infra/postgres/entities";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { ProfileService } from "src/modules/profile/services";
import { SwapService } from "src/modules/trading/services";
import { UserService } from "src/modules/users/services";
import { In } from "typeorm";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import _ = require("lodash");

const FEED_LIMIT = 100;
const STATUS = [
    SwapStatus.Confirmed,
    SwapStatus.Finalized,
    SwapStatus.Processed,
];

const getFriendsBuyFeed = async (
    userId: string,
    page: number = 0
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenObjects["GetFriendsBuyFeedResponse"][]
    >
> => {
    // get following
    const followingResp = await ProfileService.getFollowersAndFollowing(userId);
    if (followingResp.isFailure()) {
        return failure(followingResp.error);
    }
    const { following } = followingResp.value;

    const fetchIds = [...uniq(following.map((f) => f.toUserId)), userId];

    // get users and their transactions
    const offset = page * FEED_LIMIT;

    const transactionsResp = await SwapService.find({
        where: {
            // userId: In(fetchIds),
            status: In(STATUS),
            privacy: In([SwapPrivacy.Public, SwapPrivacy.Following]),
        },
        take: FEED_LIMIT,
        skip: offset,
        order: { createdAt: "DESC" },
    });
    if (transactionsResp.isFailure()) return failure(transactionsResp.error);
    const transactions = transactionsResp.value;

    // get users
    const usersResp = await UserService.find({
        select: ["id", "username", "name"],
        where: {
            // id: In(fetchIds),
            id: In(uniq(transactions.map((t) => t.userId))),
        },
    });
    if (usersResp.isFailure()) return failure(usersResp.error);
    const users = usersResp.value;
    const usersObj = keyBy(users, "id");

    // map users to transactions
    const resp = transactions
        .map((t) => {
            const user = usersObj[t.userId || ""];
            const receiveToken = t.receiveSymbol;

            // if not starting with a "$", add it
            const symbol = receiveToken.startsWith("$")
                ? receiveToken.toUpperCase()
                : `$${receiveToken.toUpperCase()}`;

            return {
                ...t,
                username: user.username || "",
                name: user.name || "Unnamed",
                symbol: symbol,
                chain: t.chain,
                iconImageUrl: t.receiveIconImageUrl,
                contractAddress: t.receiveTokenContractAddress,
                isYou: user.id === userId,
            };
        })
        .filter((r) => _isValidToken(r.symbol));

    return success(resp);
};

const getUserFeed = async (
    userId: string,
    isMe: boolean,
    page: number = 0
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenObjects["GetFriendsBuyFeedResponse"][]
    >
> => {
    const userResponse = await UserService.findById(userId);

    if (userResponse.isFailure()) {
        return failure(userResponse.error);
    }

    const user = userResponse.value;

    // get users and their transactions
    const offset = page * FEED_LIMIT;

    const [transactionsResp] = await Promise.all([
        SwapService.find({
            where: {
                userId: userId,
                status: In(STATUS),
                privacy: isMe
                    ? undefined
                    : In([SwapPrivacy.Public, SwapPrivacy.Following]),
            },
            take: FEED_LIMIT,
            skip: offset,
            order: { createdAt: "DESC" },
        }),
    ]);

    if (transactionsResp.isFailure()) return failure(transactionsResp.error);

    const transactions = transactionsResp.value;

    // map users to transactions
    const resp = transactions
        .map((t) => {
            const receiveToken = t.receiveSymbol;

            // if not starting with a "$", add it
            const symbol = receiveToken.startsWith("$")
                ? receiveToken.toUpperCase()
                : `$${receiveToken.toUpperCase()}`;

            return {
                ...t,
                username: user.username || "",
                name: user.name || "Unnamed",
                symbol: symbol,
                chain: t.chain,
                iconImageUrl: t.receiveIconImageUrl,
                contractAddress: t.receiveTokenContractAddress,
                isYou: user.id === userId,
            };
        })
        .filter((r) => _isValidToken(r.symbol));

    return success(resp);
};

const _isValidToken = (symbol: string) => {
    return symbol.toLowerCase() !== "$usdc" && symbol.toLowerCase() !== "$sol";
};
export const FriendsBuyFeedService = {
    getFriendsBuyFeed,
    getUserFeed,
};
