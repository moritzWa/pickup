import { Content, ContentSession } from "src/core/infra/postgres/entities";
import { PostgresContentRepository } from "./contentRepo";
import { PostgresContentSessionRepository } from "./contentSessionRepo";

export const contentRepo = new PostgresContentRepository(Content);
export const contentSessionRepo = new PostgresContentSessionRepository(
    ContentSession
);
