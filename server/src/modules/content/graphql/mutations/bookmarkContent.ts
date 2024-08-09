import { booleanArg, idArg, mutationField, nonNull } from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { contentRepo, interactionRepo } from "../../infra";
import { ContentSessionService } from "../../services/contentSessionService";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { v4 as uuidv4 } from "uuid";

export const bookmarkContent = mutationField("bookmarkContent", {
    type: nonNull("ContentSession"),
    args: {
        contentId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentId } = args;

        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;

        const sessionResponse = await ContentSessionService.findOrCreate(
            content,
            user
        );

        throwIfError(sessionResponse);

        await interactionRepo.create({
            id: uuidv4(),
            contentId: content.id,
            userId: user.id,
            type: InteractionType.Bookmarked,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return sessionResponse.value;
    },
});
