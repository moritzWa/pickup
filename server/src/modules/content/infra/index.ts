import {
    Content,
    ContentMessage,
    ContentSession,
    Lesson,
    LessonProgress,
    LessonSession,
} from "src/core/infra/postgres/entities";
import { PostgresContentRepository } from "./contentRepo";
import { PostgresContentSessionRepository } from "./contentSessionRepo";
import { PostgresContentMessageRepository } from "./contentMessageRepo";

export const contentRepo = new PostgresContentRepository(Content);
export const contentSessionRepo = new PostgresContentSessionRepository(
    ContentSession
);
export const contentMessageRepo = new PostgresContentMessageRepository(
    ContentMessage
);
