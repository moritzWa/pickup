import {
    Content,
    ContentSession,
    Interaction,
    FeedItem,
    ContentChunk,
} from "src/core/infra/postgres/entities";
import { PostgresContentRepository } from "./contentRepo";
import { PostgresContentSessionRepository } from "./contentSessionRepo";
import { PostgresInteractionRepository } from "./interactionRepo";
import { PostgresFeedItemRepository } from "./feedItemRepo";
import { PostgresContentChunkRepository } from "./contentChunkRepo";

export const contentRepo = new PostgresContentRepository(Content);
export const contentSessionRepo = new PostgresContentSessionRepository(
    ContentSession
);
export const interactionRepo = new PostgresInteractionRepository(Interaction);
export const feedRepo = new PostgresFeedItemRepository(FeedItem);
export const contentChunkRepo = new PostgresContentChunkRepository(
    ContentChunk
);
