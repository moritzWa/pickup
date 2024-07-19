import { enumType } from "nexus";
import { EventType } from "src/core/infra/postgres/entities/Event";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export * from "./Event";

export const EventTypeEnum = enumType({
    name: "EventTypeEnum",
    members: EventType,
});

export const EVENT_TYPE_GQL_TO_DOMAIN: Record<
    NexusGenEnums["EventTypeEnum"],
    EventType
> = {
    twitter_space: EventType.TwitterSpace,
};
