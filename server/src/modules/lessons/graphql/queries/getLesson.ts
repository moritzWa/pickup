import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonProgressRepo, lessonRepo, lessonSessionRepo } from "../../infra";

export const getLesson = queryField("getLesson", {
    type: nonNull("Lesson"),
    args: {
        lessonId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const lessonId = args.lessonId;

        const lessonResponse = await lessonRepo.findById(lessonId);

        throwIfError(lessonResponse);

        const lesson = lessonResponse.value;

        return lesson;
    },
});
