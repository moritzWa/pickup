import {
    enumType,
    list,
    nonNull,
    nullable,
    objectType,
    queryField,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { analytics } from "src/utils/segment";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ChartService } from "../../services/chartService";
import BigNumber from "bignumber.js";
import { CHART_TYPE_GQL_TO_DOMAIN, GRANULARITY_GQL_TO_DOMAIN } from "../types";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { Datadog, logHistogram } from "src/utils";
import { ChartType } from "src/shared/domain";
import { ApolloError } from "apollo-server-errors";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";

export const GetTokenChartResponse = objectType({
    name: "GetTokenChartResponse",
    definition(t) {
        t.nonNull.list.nonNull.field("points", {
            type: "TokenChartPoint",
        });
        t.field("type", {
            type: nonNull("ChartTypeEnum"),
        });
    },
});

export const getTokenChart = queryField("getTokenChart", {
    type: nonNull("GetTokenChartResponse"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        contractAddress: nonNull("String"),
        granularity: nonNull("GranularityEnum"),
        chartType: nullable("ChartTypeEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const {
            provider,
            contractAddress,
            granularity,
            chartType: _chartType,
        } = args;

        const chartType = CHART_TYPE_GQL_TO_DOMAIN[_chartType ?? "line"];

        const tradingServiceResponse = TradingIntegrationService.getIntegration(
            ACCOUNT_PROVIDER_GQL_TO_DOMAIN[provider]
        );

        if (tradingServiceResponse.isFailure()) {
            Datadog.increment("tokens.charts.err", 1, {
                type: "get_integration",
            });
            throwIfError(tradingServiceResponse);
        }

        const tradingService = tradingServiceResponse.value;

        const tokenInfoResponse = await tradingService.getToken({
            contractAddress,
        });

        if (tokenInfoResponse.isFailure()) {
            Datadog.increment("tokens.charts.err", 1, { type: "token_info" });
            throwIfError(tokenInfoResponse);
        }

        const tokenInfo = tokenInfoResponse.value;

        // console.log(`[getting chart for ${provider} ${tokenInfo.symbol}]`);

        // console.time("get-token-chart-" + contractAddress + "-" + granularity);

        if (chartType === ChartType.Line) {
            const chartResponse = await ChartService.getLineChart(
                tokenInfo,
                GRANULARITY_GQL_TO_DOMAIN[granularity]
            );

            if (chartResponse.isFailure()) {
                Datadog.increment("tokens.charts.err", 1, { type: "line" });
                throwIfError(chartResponse);
            }

            Datadog.increment("tokens.charts.ok", 1, { type: "line" });

            const chart = chartResponse.value;

            return {
                type: chartType,
                points: chart,
            };
        }

        if (chartType === ChartType.Candlestick) {
            const chartResponse = await ChartService.getCandlestickChart(
                tokenInfo,
                GRANULARITY_GQL_TO_DOMAIN[granularity]
            );

            if (chartResponse.isFailure()) {
                Datadog.increment("tokens.charts.err", 1, {
                    type: "candlestick",
                });
                throwIfError(chartResponse);
            }

            Datadog.increment("tokens.charts.ok", 1, { type: "candlestick" });

            const chart = chartResponse.value;

            return {
                type: chartType,
                points: chart,
            };
        }

        throw new ApolloError("Candlestick chart not supported yet.", "400");
    },
});
