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
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { lessonRepo, lessonSessionRepo } from "../../infra";
import { ResponseService } from "../../services/respondService";

export const RespondResponse = objectType({
    name: "RespondResponse",
    definition(t) {
        t.nonNull.string("transcription");
        t.nonNull.string("responseAudioUrl");
    },
});

export const respond = mutationField("respond", {
    type: nonNull("RespondResponse"),
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

        const respondResponse = await ResponseService.respond(
            lesson,
            audioFileUrl
        );

        throwIfError(respondResponse);

        return {
            transcription: respondResponse.value.transcription,
            responseAudioUrl: respondResponse.value.responseAudioUrl,
        };
    },
});
