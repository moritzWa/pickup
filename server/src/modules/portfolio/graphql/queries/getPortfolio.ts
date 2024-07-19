import {
    booleanArg,
    enumType,
    list,
    nonNull,
    nullable,
    objectType,
    queryField,
} from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import {
    NexusGenEnums,
    NexusGenObjects,
} from "src/core/surfaces/graphql/generated/nexus";
import {
    D,
    Datadog,
    Slack,
    SlackChannel,
    ZERO_BN,
    sumBigNumbers,
} from "src/utils";
import { CurrencyCode } from "src/shared/domain";
import { MagicPortfolioService } from "../../services/portfolioService/magicPortfolioService";
import { formatPercent } from "src/modules/portfolio/services/portfolioService/pricingService";
import { FullPosition } from "src/shared/integrations/types";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { shouldIncludePosition } from "./utils";
import { isNil, keyBy } from "lodash";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { In } from "typeorm";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { enqueueFirebaseUpload } from "src/modules/tokens/services/enqueueFirebaseUpload";
import { getTokenThumbnailIconImageUrl } from "src/core/infra/postgres/entities/Token";

export const PortfolioResponse = objectType({
    name: "PortfolioResponse",
    definition(t) {
        t.field("positions", {
            type: nonNull(list(nonNull("PortfolioPosition"))),
        });
        t.nonNull.int("totalFiatAmountCents");
        t.nonNull.string("totalFiatAmount");
        t.nonNull.string("dailyChangePercentageFormatted");
        t.nonNull.float("dailyChangeFiatAmountCents");
        t.nonNull.string("dailyChangeFiatAmount");
    },
});

const PROVIDER = AccountProvider.Solana;

export const getPortfolio = queryField("getPortfolio", {
    type: nonNull("PortfolioResponse"),
    args: {
        useCache: nullable(booleanArg()),
    },
    resolve: async (_parent, args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        // get magic positions
        const positionsResponse = await MagicPortfolioService.getFullPositions(
            user,
            args.useCache ?? false
        );
        if (positionsResponse.isFailure()) {
            console.log("=== portfolio error ===");
            console.log(positionsResponse);

            Datadog.increment("portfolio.err", { type: "get_full_positions" });

            void Slack.send({
                channel: SlackChannel.TradingNever,
                message: `Failed to get portfolio for user ${user.id} (${user.email}) - magic getFullPositions failed - ${positionsResponse.error.message}`,
            });

            throwIfError(positionsResponse);
        }

        // get tokens from db
        const tokensResp = await TokenService.find({
            where: {
                provider: PROVIDER,
                contractAddress: In(
                    positionsResponse.value.map((p) => p.contractAddress)
                ),
            },
        });
        if (tokensResp.isFailure()) {
            console.log("=== portfolio error ===");
            console.log(tokensResp.error);

            Datadog.increment("portfolio.err", { type: "get_tokens" });

            void Slack.send({
                channel: SlackChannel.TradingNever,
                message: `Failed to get tokens for user ${user.id} (${user.email}) - token DB query failed - ${tokensResp.error.message}`,
            });

            throwIfError(tokensResp);
        }
        const tokens = tokensResp.value;

        const formattedPositionsResponse = _formatPositions(
            positionsResponse.value,
            tokens
        );

        if (formattedPositionsResponse.isFailure()) {
            console.log("=== portfolio error ===");
            console.log(formattedPositionsResponse.error);

            Datadog.increment("portfolio.err", { type: "format_positions" });

            void Slack.send({
                channel: SlackChannel.TradingNever,
                message: `Failed to format portfolio positions for user ${user.id} (${user.email}) - ${formattedPositionsResponse.error.message}`,
            });

            throwIfError(formattedPositionsResponse);
        }

        Datadog.increment("portfolio.ok");

        return formattedPositionsResponse.value;
    },
});

const _formatPositions = (
    allPositions: FullPosition[],
    tokens: Token[]
): FailureOrSuccess<DefaultErrors, NexusGenObjects["PortfolioResponse"]> => {
    const tokensByKey = keyBy(tokens, (t) =>
        TokenService.buildKey(t.provider, t.contractAddress)
    );

    try {
        const _totalFiatAmountCents = sumBigNumbers(
            allPositions.map((p) =>
                !isNil(p.totalFiatAmountCents) &&
                !p.totalFiatAmountCents.isNaN()
                    ? p.totalFiatAmountCents
                    : ZERO_BN
            )
        );

        const totalFiatAmountCents =
            !_totalFiatAmountCents.isNaN() && _totalFiatAmountCents.isFinite()
                ? _totalFiatAmountCents
                : ZERO_BN;

        const totalFiatAmount = D(
            totalFiatAmountCents.dp(0).toNumber(),
            CurrencyCode.USD
        );

        const positions = allPositions
            .map((p): NexusGenObjects["PortfolioPosition"] => {
                const token =
                    tokensByKey[
                        TokenService.buildKey(p.provider, p.contractAddress)
                    ];

                const iconImageUrl =
                    token?.iconImageUrl || p.iconImageUrl || "";

                if (token && !token.hasAddedToCdn) {
                    void enqueueFirebaseUpload(token, iconImageUrl);
                }

                return {
                    provider: p.provider,
                    contractAddress: p.contractAddress,
                    fiatCurrency: p.fiatCurrency,
                    iconImageUrl:
                        getTokenThumbnailIconImageUrl(token) || iconImageUrl,
                    symbol: p.symbol ?? "",
                    canSelectToken: p.canSelectToken,
                    amount: p.amount?.toNumber() ?? 0,
                    fiatAmountCents: p?.totalFiatAmountCents?.toNumber() ?? 0,
                    dailyChangePercentage: p?.dailyChangePercentage?.toNumber(),
                    dailyChangePerUnitCents:
                        p?.dailyChangePerUnitCents?.toNumber(),
                    dailyFiatAmountCents: p?.dailyFiatAmountCents?.toNumber(),
                    dailyPercentageFormatted: p?.dailyPercentageFormatted,
                };
            })
            .filter(shouldIncludePosition);

        const _overallDailyFiatAmountCents = sumBigNumbers(
            allPositions.map((p) =>
                !isNil(p.dailyFiatAmountCents) &&
                !p.dailyFiatAmountCents.isNaN()
                    ? p.dailyFiatAmountCents
                    : ZERO_BN
            )
        );

        const overallDailyFiatAmountCents =
            !_overallDailyFiatAmountCents.isNaN() &&
            _overallDailyFiatAmountCents.isFinite()
                ? _overallDailyFiatAmountCents
                : ZERO_BN;

        // make a variable called startingDayBalance that is the starting balance at the beginning of the day
        // taking into account that the overallDailyFiatAmountCents can be negative or postiive
        const startingDayBalance = totalFiatAmountCents.minus(
            overallDailyFiatAmountCents
        );

        // get the daily percentage change using the overal daily change and the current total value
        const overallDailyPercentage = startingDayBalance.gt(0)
            ? overallDailyFiatAmountCents.dividedBy(startingDayBalance)
            : ZERO_BN;

        const response: NexusGenObjects["PortfolioResponse"] = {
            positions,
            dailyChangeFiatAmountCents: overallDailyFiatAmountCents
                .dp(0)
                .toNumber(),
            dailyChangeFiatAmount: D(
                overallDailyFiatAmountCents.dp(0).toNumber(),
                CurrencyCode.USD
            ).toFormat(),
            dailyChangePercentageFormatted:
                formatPercent(overallDailyPercentage) ?? "0%",
            totalFiatAmountCents: totalFiatAmountCents.dp(0).toNumber(),
            totalFiatAmount: totalFiatAmount.toFormat(),
        };

        return success(response);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
