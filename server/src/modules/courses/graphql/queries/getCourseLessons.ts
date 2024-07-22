import { idArg, list, nonNull, nullable, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { lessonRepo } from "src/modules/lessons/infra";
import { stripe } from "src/utils";

export const getCourseLessons = queryField("getCourseLessons", {
    type: nonNull(list(nonNull("Lesson"))),
    args: {
        courseId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const courseId = args.courseId;

        const lessonsResponse = await lessonRepo.findForCourse(courseId);

        throwIfError(lessonsResponse);

        const lessons = lessonsResponse.value;

        return lessons;
    },
});
