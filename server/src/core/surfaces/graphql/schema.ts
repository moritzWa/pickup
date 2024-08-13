import * as GraphQLUpload from "graphql-upload/GraphQLUpload.js";
import { fieldAuthorizePlugin, makeSchema } from "nexus";
import * as path from "path";
import { DateScalar } from "./base";

// resolvers
import * as author from "src/modules/author/graphql";
import * as content from "src/modules/content/graphql";
import * as curius from "src/modules/curius/graphql";
import * as users from "src/modules/users/graphql";
import * as schemas from "src/shared/schemas";

const types = {
    Date: DateScalar,
    Upload: GraphQLUpload,
    ...schemas,
    ...users,
    ...content,
    ...author,
    ...curius,
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
