import { Course } from "src/core/infra/postgres/entities";
import { PostgresCourseRepository } from "./courseRepo";

export const courseRepo = new PostgresCourseRepository(Course);
