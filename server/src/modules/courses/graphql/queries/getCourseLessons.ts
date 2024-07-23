import { keyBy } from "lodash";
import { idArg, list, nonNull, nullable, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { lessonProgressRepo, lessonRepo } from "src/modules/lessons/infra";
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

        const [lessonsResponse, progressResponse] = await Promise.all([
            lessonRepo.findForCourse(courseId),
            lessonProgressRepo.findForCourse(courseId),
        ]);

        throwIfError(lessonsResponse);
        throwIfError(progressResponse);

        const progressByLesson = keyBy(
            progressResponse.value,
            (p) => p.lessonId
        );

        const lessons = lessonsResponse.value.map((l) => ({
            ...l,
            progress: progressByLesson[l.id] ?? null,
            sessions: [],
        }));

        return lessons;
    },
});
