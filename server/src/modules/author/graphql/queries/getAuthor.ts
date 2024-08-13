import { idArg, nonNull, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { authorRepo } from "../../infra";
import { Author } from "../types/Author";

export const getAuthor = queryField("getAuthor", {
    type: nonNull(Author),
    args: {
        authorId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const authorId = args.authorId;

        const authorResponse = await authorRepo.findById(authorId);

        throwIfError(authorResponse);

        const author = authorResponse.value;

        return {
            ...author,
        };
    },
});
