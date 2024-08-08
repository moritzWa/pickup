import { booleanArg, idArg, mutationField, nonNull } from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { contentRepo, interactionRepo } from "../../infra";
import { v4 as uuidv4 } from "uuid";
import { INTERACTION_TYPE_MAPPING } from "../types";

export const recordInteraction = mutationField("recordInteraction", {
    type: nonNull("Interaction"),
    args: {
        contentId: nonNull(idArg()),
        eventType: nonNull("InteractionTypeEnum"),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentId, eventType } = args;

        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;
        const type = INTERACTION_TYPE_MAPPING[eventType];

        const response = await interactionRepo.create({
            id: uuidv4(),
            contentId: content.id,
            userId: user.id,
            type: type,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        throwIfError(response);

        return response.value;
    },
});
