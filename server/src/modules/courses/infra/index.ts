import { Course, CourseProgress } from "src/core/infra/postgres/entities";
import { PostgresCourseRepository } from "./courseRepo";
import { PostgresCourseProgressRepository } from "./courseProgressRepo";

export const courseRepo = new PostgresCourseRepository(Course);
export const courseProgressRepo = new PostgresCourseProgressRepository(
    CourseProgress
);
