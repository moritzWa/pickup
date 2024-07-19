import { Vote } from "src/core/infra/postgres/entities";
import { PostgresVoteRepository } from "./postgres";

export const pgVoteRepo = new PostgresVoteRepository(Vote);
