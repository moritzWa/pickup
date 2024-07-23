import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { courseProgressRepo, courseRepo } from "../../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";

export const getCourse = queryField("getCourse", {
    type: nonNull("Course"),
    args: {
        courseId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const courseId = args.courseId;

        const [courseResponse, progressResponse] = await Promise.all([
            courseRepo.findById(courseId),
            courseProgressRepo.findForCourseAndUser(courseId, user.id, {
                relations: { mostRecentLesson: true },
            }),
        ]);

        throwIfError(courseResponse);
        throwIfError(progressResponse);

        const course = courseResponse.value;
        const courseProgress = progressResponse.value;

        return {
            ...course,
            isStarted: !!courseProgress,
            mostRecentLesson: courseProgress.mostRecentLesson,
        };
    },
});
