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
import { ResponseService } from "../../services/respondService";
import { contentRepo } from "../../infra";

export const ContentRespondResponse = objectType({
    name: "ContentRespondResponse",
    definition(t) {
        t.nonNull.string("transcription");
        t.nonNull.string("responseAudioUrl");
    },
});

export const respondToContent = mutationField("respondToContent", {
    type: nonNull("ContentRespondResponse"),
    args: {
        contentId: nonNull(idArg()),
        // URL to a cloud file. this will be directly uploaded to a place like firebase storage
        audioFileUrl: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentId, audioFileUrl } = args;

        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;

        // const respondResponse = await ResponseService.respond(
        //     lesson,
        //     audioFileUrl
        // );

        // throwIfError(respondResponse);

        return {
            transcription: "",
            responseAudioUrl: "",
        };
    },
});
