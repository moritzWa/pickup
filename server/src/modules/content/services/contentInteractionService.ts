// TODO: fill this in and then hook it up
const interact = async () => {
    // if current ms is less than 15 seconds, record interaction of skipping the content
    //  if (args.currentMs && args.currentMs < 15000) {
    //     await interactionRepo.create({
    //         id: uuidv4(),
    //         contentId: content.id,
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
    interact,
};
