import { Competition } from "src/core/infra/postgres/entities";
import { PostgresCompetitionRepository } from "./postgres";

export const pgCompetitionRepo = new PostgresCompetitionRepository(Competition);
