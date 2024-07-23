import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { loops } from "src/utils/loops";
import { auth } from "firebase-admin";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { lessonRepo, lessonSessionRepo } from "../../infra";
import { v4 as uuidv4 } from "uuid";
import { courseProgressRepo } from "src/modules/courses/infra";

export const startLesson = mutationField("startLesson", {
    type: nonNull("LessonSession"),
    args: {
        lessonId: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { lessonId } = args;
        const user = ctx.me!;

        const lessonResponse = await lessonRepo.findById(lessonId);

        throwIfError(lessonResponse);

        const lesson = lessonResponse.value;

        const sessionResponse = await lessonSessionRepo.create({
            id: uuidv4(),
            audioUrl: "",
            courseId: lesson.courseId,
            lessonId: lesson.id,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        throwIfError(sessionResponse);

        const session = sessionResponse.value;

        // update the most recently played lesson
        await courseProgressRepo.updateProgressOfCourse(
            user.id,
            lesson.courseId,
            {
                mostRecentLessonId: lesson.id,
            }
        );

        return session;
    },
});
