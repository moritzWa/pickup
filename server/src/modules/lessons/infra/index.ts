import {
    Lesson,
    LessonProgress,
    LessonSession,
} from "src/core/infra/postgres/entities";
import { PostgresLessonRepository } from "./lessonRepo";
import { PostgresLessonSessionRepository } from "./lessonSessionRepo";
import { PostgresLessonProgressRepository } from "./lessonProgressRepo";

export const lessonRepo = new PostgresLessonRepository(Lesson);
export const lessonSessionRepo = new PostgresLessonSessionRepository(
    LessonSession
);
export const lessonProgressRepo = new PostgresLessonProgressRepository(
    LessonProgress
);
