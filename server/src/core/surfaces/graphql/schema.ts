import { makeSchema, fieldAuthorizePlugin } from "nexus";
import * as path from "path";
import { DateScalar } from "./base";
import * as GraphQLUpload from "graphql-upload/GraphQLUpload.js";

// resolvers
import * as schemas from "src/shared/schemas";
import * as users from "src/modules/users/graphql";
import * as portfolio from "src/modules/portfolio/graphql";
import * as trading from "src/modules/trading/graphql";
import * as discovery from "src/modules/discovery/graphql";
import * as watchlist from "src/modules/watchlist/graphql";
import * as wallets from "src/modules/wallets/graphql";
import * as transactions from "src/modules/transactions/graphql";
import * as tokens from "src/modules/tokens/graphql";
import * as news from "src/modules/news/graphql";
import * as misc from "src/modules/misc/graphql/mutations";
import * as transfers from "src/modules/transfers/graphql";
import * as profile from "src/modules/profile/graphql";
import * as airdrops from "src/modules/airdrops/graphql";
import * as notifications from "src/modules/notifications/graphql";
import * as friendsBuyFeed from "src/modules/friendsBuyFeed/graphql";
import * as feeds from "src/modules/feeds/graphql";
import * as referrals from "src/modules/referral/graphql";
import * as categories from "src/modules/categories/graphql";
import * as events from "src/modules/events/graphql";
import * as competitions from "src/modules/competitions/graphql";
import * as votes from "src/modules/votes/graphql";

const types = {
    Date: DateScalar,
    Upload: GraphQLUpload,
    ...schemas,
    ...transactions,
    ...portfolio,
    ...trading,
    ...discovery,
    ...users,
    ...wallets,
    ...tokens,
    ...watchlist,
    ...news,
    ...misc,
    ...transfers,
    ...profile,
    ...airdrops,
    ...notifications,
    ...friendsBuyFeed,
    ...feeds,
    ...referrals,
    ...categories,
    ...events,
    ...competitions,
    ...votes,
};

export const schema = makeSchema({
    types,
    contextType: {
        module: require.resolve("./context"),
        export: "Context",
    },
    sourceTypes: {
        // debug: true, will do verbose logging for schemas
        modules: [
            {
                module: require.resolve("../../infra/postgres/entities/index"),
                alias: "entities",
                typeMatch: (type) => [new RegExp(`(${type.name}[ ,]+)`)],
            },
        ],
        mapping: {
            Job: "entities.GQLJob",
        },
    },
    outputs: {
        schema: path.join(__dirname, "../../../../../schema.graphql"),
        typegen: path.join(
            __dirname,
            "../../surfaces/graphql/generated/nexus.ts"
        ),
    },
    plugins: [fieldAuthorizePlugin()],
});

if (require.main === module) {
    process.exit(0);
}
