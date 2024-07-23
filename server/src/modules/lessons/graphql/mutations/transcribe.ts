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
import { lessonRepo, lessonSessionRepo } from "../../infra";
import { v4 as uuidv4 } from "uuid";
import { courseProgressRepo } from "src/modules/courses/infra";
import { openai } from "src/utils";
import * as path from "path";
import { Readable } from "stream";
import axios from "axios";
import { createReadStream } from "fs";
import { TranscribeService } from "../../services/transcribeService";

export const TranscribeResponse = objectType({
    name: "TranscribeResponse",
    definition(t) {
        t.nonNull.string("transcription");
    },
});

export const transcribe = mutationField("transcribe", {
    type: nonNull("TranscribeResponse"),
    args: {
        lessonId: nonNull(idArg()),
        // URL to a cloud file. this will be directly uploaded to a place like firebase storage
        audioFileUrl: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { lessonId, audioFileUrl } = args;

        console.log("Transcribing lesson", lessonId);

        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const lessonResponse = await lessonRepo.findById(lessonId);

        throwIfError(lessonResponse);

        const lesson = lessonResponse.value;

        const transcriptionResponse =
            await TranscribeService.transcribeAudioUrl(lesson, audioFileUrl);

        throwIfError(transcriptionResponse);

        return {
            transcription: transcriptionResponse.value,
        };
    },
});
