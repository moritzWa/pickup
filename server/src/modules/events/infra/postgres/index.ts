import { Event } from "src/core/infra/postgres/entities";
import { PostgresEventRepository } from "./eventRepo";

export const pgEventRepo = new PostgresEventRepository(Event);
