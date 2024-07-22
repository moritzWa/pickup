import { Lesson } from "src/core/infra/postgres/entities";
import { PostgresLessonRepository } from "./lessonRepo";

export const lessonRepo = new PostgresLessonRepository(Lesson);
