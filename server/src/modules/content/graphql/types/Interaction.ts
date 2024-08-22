import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const InteractionTypeEnum = enumType({
    name: "InteractionTypeEnum",
    members: InteractionType,
});

export const Interaction = objectType({
    name: "Interaction",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.id("contentId");
        t.field("type", { type: nonNull("InteractionTypeEnum") });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});

export const INTERACTION_TYPE_MAPPING: Record<
    NexusGenEnums["InteractionTypeEnum"],
    InteractionType
> = {
    bookmarked: InteractionType.Bookmarked,
    likes: InteractionType.Likes,
    scrolled_past: InteractionType.ScrolledPast,
    skipped: InteractionType.Skipped,
    left_in_progress: InteractionType.LeftInProgress,
    listened_to_beginning: InteractionType.ListenedToBeginning,
    finished: InteractionType.Finished,
    started_listening: InteractionType.StartedListening,
    queued: InteractionType.Queued,
    unbookmarked: InteractionType.Unbookmarked,
};
