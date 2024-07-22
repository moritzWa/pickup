import { LessonSession } from "src/core/infra/postgres/entities";
import { PostgresLessonSessionRepository } from "./lessonSessionRepo";

export const lessonSessionRepo = new PostgresLessonSessionRepository(
    LessonSession
);
