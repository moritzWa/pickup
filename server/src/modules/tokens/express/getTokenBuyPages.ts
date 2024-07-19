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
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ChartService } from "../services/chartService";
import BigNumber from "bignumber.js";
import {
    CHART_TYPE_GQL_TO_DOMAIN,
    GRANULARITY_GQL_TO_DOMAIN,
} from "../graphql/types";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { Datadog, Slack, SlackChannel, logHistogram } from "src/utils";
import { ChartType } from "src/shared/domain";
import { ApolloError } from "apollo-server-errors";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { Request, Response } from "express";
import { pgCategoryEntryRepo } from "src/modules/categories/infra";
import { config } from "src/config";
import { isNil, uniqBy } from "lodash";
import { Token } from "src/core/infra/postgres/entities";
import { pgTokenRepo } from "../postgres";
import { TokenService } from "../services/tokenService/tokenService";
import { fork, parallel } from "radash";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

export const getTokenBuyPages = async (req: Request, res: Response) => {
    const rootDomain = req.query.domain ?? "https://www.movement.market";

    const [entriesResponse, tokensResponse] = await Promise.all([
        pgCategoryEntryRepo.find({
            relations: {
                token: true,
            },
        }),
        pgTokenRepo.find({
            where: [
                { isClaimed: true },
                { isStrict: true },
                { isMovementVerified: true },
            ],
        }),
    ]);

    throwIfError(entriesResponse);
    throwIfError(tokensResponse);

    const entries = entriesResponse.value;
    const categoryTokens = entries.map((entry) => entry.token);
    const allTokens = tokensResponse.value;
    const uniqTokens = uniqBy([...categoryTokens, ...allTokens], (t) => t.id);

    const allTokensResponse = await _fillInSlugs(uniqTokens);

    throwIfError(allTokensResponse);

    const urls = new Set(
        allTokensResponse.value
            .filter((t) => !isNil(t.slug))
            .map((token) => {
                const name = token.name.toLowerCase();
                const slug = token.slug || "";

                return `${rootDomain}/how-to-buy/${slug}/${encodeURIComponent(
                    name
                )}`;
            })
    );

    // send response with all the URLs

    return res.status(200).json({ urls: Array.from(urls) });
};

export const _fillInSlugs = async (
    tokens: Pick<Token, "id" | "slug" | "symbol" | "name">[]
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        Pick<Token, "id" | "slug" | "symbol" | "name">[]
    >
> => {
    const [missingSlugs, hasSlugs] = fork(tokens, (t) => !t.slug);

    const slugs = await parallel(10, missingSlugs, async (token) => {
        const slug = await TokenService.getSlug(token);
        return pgTokenRepo.update(token.id, { slug });
    });

    const failures = slugs.filter((s) => s.isFailure());

    if (failures.length > 0) {
        void Slack.send({
            channel: SlackChannel.TradingUrgent,
            format: true,
            message: `Failed to update slugs for tokens: ${failures
                .map((f) => f.error.message)
                .join(", ")}`,
        });
        return failure(
            new UnexpectedError("Failed to update slugs for some tokens.")
        );
    }

    const newSlugs = slugs.map((s) => s.value);

    const allTokens = [...hasSlugs, ...newSlugs];

    return success(allTokens);
};
