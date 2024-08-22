import { arg, idArg, mutationField, nonNull } from "nexus";
import { User } from "src/core/infra/postgres/entities";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { v4 as uuidv4 } from "uuid";
import { contentRepo, contentSessionRepo, interactionRepo } from "../../infra";
import { ContentSessionService } from "../../services/contentSessionService";

export const bookmarkContent = mutationField("bookmarkContent", {
    type: nonNull("ContentSession"),
    args: {
        contentId: nonNull(idArg()),
        authProviderId: arg({ type: "String" }),
    },
    resolve: async (_parent, args, ctx: Context, _info) => {
        const { contentId, authProviderId } = args;

        let user = await getUserFromContextOrAuthProviderId(
            ctx,
            authProviderId
        );

        if (!user) {
            throw new Error("User not authenticated");
        }

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;

        const sessionResponse = await ContentSessionService.findOrCreate(
            content,
            user
        );

        throwIfError(sessionResponse);

        const session = sessionResponse.value;
        const newBookmark = !session.isBookmarked;

        const newContentSessionResponse = await contentSessionRepo.update(
            sessionResponse.value.id,
            {
                isBookmarked: newBookmark,
                bookmarkedAt: newBookmark ? new Date() : null,
            }
        );

        throwIfError(newContentSessionResponse);

        await interactionRepo.create({
            id: uuidv4(),
            contentId: content.id,
            userId: user.id,
            type: InteractionType.Bookmarked,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return newContentSessionResponse.value;
    },
});

async function getUserFromContextOrAuthProviderId(
    ctx: Context,
    authProviderId?: string | null
): Promise<User | null> {
    if (ctx.me) {
        return ctx.me;
    }
    if (authProviderId) {
        const userResponse = await pgUserRepo.findOne({
            where: { authProviderId },
        });
        if (userResponse.isSuccess() && userResponse.value) {
            return userResponse.value;
        }
    }
    return null;
}
