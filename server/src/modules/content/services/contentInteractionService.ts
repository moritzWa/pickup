import { ContentSession, User } from "src/core/infra/postgres/entities";
import { interactionRepo } from "../infra";
import { v4 as uuidv4 } from "uuid";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";

const recordProgress = async (
    user: User,
    session: ContentSession,
    currentMs: number
) => {
    // if current ms is less than 15 seconds, record interaction of skipping the content
    //  if (currentMs && currentMs < 15000) {
    //     return await interactionRepo.create({
    //         id: uuidv4(),
    //         contentId: session.contentId,
    //         userId: user.id,
    //         type: InteractionType.Skipped,
    //         createdAt: new Date(),
    //         updatedAt: new Date(),
    //     });
    // } else if (
    //     args.currentMs &&
    //     args.currentMs < content.lengthMs - 5_000
    // ) {
    //     await interactionRepo.create({
    //         id: uuidv4(),
    //         contentId: content.id,
    //         userId: user.id,
    //         type: InteractionType.LeftInProgress,
    //         createdAt: new Date(),
    //         updatedAt: new Date(),
    //     });
    // } else if (
    //     args.currentMs &&
    //     content.lengthMs - 5_000 < args.currentMs
    // ) {
    //     await interactionRepo.create({
    //         id: uuidv4(),
    //         contentId: content.id,
    //         userId: user.id,
    //         type: InteractionType.Finished,
    //         createdAt: new Date(),
    //         updatedAt: new Date(),
    //     });
    // }
};

export const ContentInteractionService = {
    recordProgress,
};
