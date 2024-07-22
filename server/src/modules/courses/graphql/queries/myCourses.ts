import { list, nonNull, nullable, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { participantRepo } from "src/modules/participants/infra";
import { stripe } from "src/utils";

export const myCourses = queryField("myCourses", {
    type: nonNull(list(nonNull("Course"))),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const participantsResponse = await participantRepo.findForUser(
            user.id,
            {
                relations: {
                    course: true,
                },
            }
        );

        throwIfError(participantsResponse);

        const courses = participantsResponse.value.map((p) => p.course);

        return courses;
    },
});
