import { list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { courseRepo } from "../../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getCourses = queryField("getCourses", {
    type: nonNull(list(nonNull("Course"))),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const coursesResponse = await courseRepo.find({});

        throwIfError(coursesResponse);

        const courses = coursesResponse.value;

        return courses;
    },
});
