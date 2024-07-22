import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    idArg,
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
import { courseRepo } from "../../infra";
import { participantRepo } from "src/modules/participants/infra";
import { v4 as uuidv4 } from "uuid";
import { ParticipantStatus } from "src/core/infra/postgres/entities/Participant";
import { ParticipantService } from "src/modules/participants/services";

export const startCourse = mutationField("startCourse", {
    type: nonNull("Course"),
    args: {
        courseId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const courseResponse = await courseRepo.findById(args.courseId);

        throwIfError(courseResponse);

        const course = courseResponse.value;

        const participantsResponse =
            await ParticipantService.createParticipants(course, user);

        throwIfError(participantsResponse);

        return course;
    },
});
