import { list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { courseProgressRepo, courseRepo } from "../../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { keyBy } from "lodash";

export const getCourses = queryField("getCourses", {
    type: nonNull(list(nonNull("Course"))),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const coursesResponse = await courseRepo.find({});

        throwIfError(coursesResponse);

        const courses = coursesResponse.value;

        // get the most recent lesson for user for each course
        const courseIds = courses.map((c) => c.id);

        const progressResponse = await courseProgressRepo.findForUserAndCourses(
            user.id,
            courseIds,
            {
                relations: { mostRecentLesson: true },
            }
        );

        throwIfError(progressResponse);

        const progress = progressResponse.value;
        const progressById = keyBy(progress, (l) => l.courseId);

        const fullCourses = courses.map((c) => {
            const progress = progressById[c.id];

            return {
                ...c,
                isStarted: !!progress,
                mostRecentLesson: progress?.mostRecentLesson,
            };
        });

        return fullCourses;
    },
});
