import { Session } from "src/core/infra/postgres/entities";
import { PostgresSessionRepository } from "./sessionRepo";

export const sessionRepo = new PostgresSessionRepository(Session);
