import {
    enumType,
    idArg,
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
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentSessionRepo } from "../../infra";
import { omit } from "lodash";
import { CATEGORIES } from "../../services/categories";

export const getCategories = queryField("getCategories", {
    type: nonNull(list(nonNull("CategorySection"))),
    resolve: async (_parent, args, ctx: Context) => {
        return CATEGORIES;
    },
});
