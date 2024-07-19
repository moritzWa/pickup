import {
    AccountProvider,
    Token as TokenModel,
} from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import { Token } from "src/shared/integrations/types";
import { TradingIntegrationService } from "src/shared/integrations";
import { pgTokenRepo } from "../../postgres";
import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    IsNull,
    Not,
} from "typeorm";
import { isDeadToken } from "./isDeadToken";
import { checkDeadTokens } from "./checkDeadTokens";
import { find } from "./find";
import { TokenParams } from "../../postgres/tokenRepository";
import { Dictionary } from "lodash";
import {
    BlacklistReason,
    MemecoinLink,
    MemecoinLinkType,
} from "src/core/infra/postgres/entities/Token";
import slugify from "slugify";

const buildKey = (
    provider: AccountProvider,
    contractAddress: string
): string => {
    return `${provider}:${contractAddress}`;
};

const findOne = async (options: FindOneOptions<TokenModel>) =>
    pgTokenRepo.findOne(options);

const save = async (token: TokenModel) => pgTokenRepo.save(token);

const saveMany = async (tokens: TokenModel[]) => pgTokenRepo.saveMany(tokens);

const create = async (token: TokenParams) => pgTokenRepo.create(token);

const createMany = async (tokens: TokenParams[]) =>
    pgTokenRepo.createMany(tokens);

const deleteById = async (id: string) => pgTokenRepo.deleteById(id);

const createDefaultLinks = (ca: string): MemecoinLink[] => {
    return [
        {
            type: MemecoinLinkType.Raydium,
            url: `https://raydium.io/swap/?inputMint=sol&outputMint=${ca}`,
            alwaysShow: true,
        },
        {
            type: MemecoinLinkType.Jupiter,
            url: `https://jup.ag/swap/SOL-${ca}`,
            alwaysShow: true,
        },
    ];
};

const addDefaultLinks = (ca: string, moreLinks: MemecoinLink[]) => {
    const defaultLinks = createDefaultLinks(ca);
    for (const link of defaultLinks) {
        if (moreLinks.every((l) => l.type !== link.type)) {
            moreLinks = moreLinks.concat(link);
        }
    }
    return moreLinks;
};

const update = async (
    id: string,
    token: Partial<TokenModel>,
    dbTxn?: EntityManager
) => pgTokenRepo.update(id, token, dbTxn);

const getToken = async ({
    provider,
    contractAddress,
}: {
    provider: AccountProvider;
    contractAddress: string;
}): Promise<FailureOrSuccess<DefaultErrors, Token>> => {
    const tradingServiceResponse =
        TradingIntegrationService.getIntegration(provider);

    if (tradingServiceResponse.isFailure()) {
        return failure(tradingServiceResponse.error);
    }

    const tradingService = tradingServiceResponse.value;

    const tokenInfoResponse = await tradingService.getToken({
        contractAddress,
    });

    if (tokenInfoResponse.isFailure()) {
        return failure(tokenInfoResponse.error);
    }

    const tokenInfo = tokenInfoResponse.value;

    return success(tokenInfo);
};

type SameTokenParams = {
    contractAddress: string;
    provider: AccountProvider;
};

const isSameToken = (a: SameTokenParams, b: SameTokenParams): boolean => {
    return (
        buildKey(a.provider, a.contractAddress) ===
        buildKey(b.provider, b.contractAddress)
    );
};

const getBlacklist = async (): Promise<
    FailureOrSuccess<DefaultErrors, Dictionary<Maybe<BlacklistReason>>>
> => {
    const tokensResp = await TokenService.find({
        where: {
            isBlacklisted: Not(IsNull()),
        },
    });
    if (tokensResp.isFailure()) return failure(tokensResp.error);
    const blacklistObj = Object.fromEntries(
        tokensResp.value.map((t) => [
            TokenService.buildKey(t.provider, t.contractAddress),
            t.isBlacklisted,
        ])
    );
    return success(blacklistObj);
};

const getSlug = async (
    token: Pick<TokenModel, "symbol" | "id">
): Promise<string | null> => {
    const slug = slugify(token.symbol).toLowerCase();

    // get if it exists
    const existResponse = await pgTokenRepo.exists({
        where: {
            slug,
            id: Not(token.id),
        },
    });

    if (existResponse.isFailure()) {
        return null;
    }

    const exists = existResponse.value;

    if (!exists) {
        return slug;
    }

    const random4Digit = Math.floor(1000 + Math.random() * 9000);
    const slg = slug + "-" + random4Digit;

    return slg;
};

const shouldAlwaysShow = (memecoinLinkType: MemecoinLinkType) => {
    return (
        memecoinLinkType === MemecoinLinkType.Twitter ||
        memecoinLinkType === MemecoinLinkType.Telegram ||
        memecoinLinkType === MemecoinLinkType.Website ||
        memecoinLinkType === MemecoinLinkType.DexScreener
    );
};

export const TokenService = {
    find,
    update,
    getSlug,
    findOne,
    save,
    saveMany,
    create,
    createMany,
    createDefaultLinks,
    addDefaultLinks,
    buildKey,
    getToken,
    isSameToken,
    isDeadToken,
    checkDeadTokens,
    deleteById,
    getBlacklist,
    shouldAlwaysShow,
};
