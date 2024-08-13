import {
    Content,
    ContentSession,
    Interaction,
    FeedItem,
} from "src/core/infra/postgres/entities";
import { PostgresContentRepository } from "./contentRepo";
import { PostgresContentSessionRepository } from "./contentSessionRepo";
import { PostgresInteractionRepository } from "./interactionRepo";
import { PostgresFeedItemRepository } from "./feedItemRepo";

export const contentRepo = new PostgresContentRepository(Content);
export const contentSessionRepo = new PostgresContentSessionRepository(
    ContentSession
);
export const interactionRepo = new PostgresInteractionRepository(Interaction);
export const feedRepo = new PostgresFeedItemRepository(FeedItem);
