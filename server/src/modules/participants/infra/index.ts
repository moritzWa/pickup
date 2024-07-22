import { Participant } from "src/core/infra/postgres/entities";
import { PostgresParticipantRepository } from "./participantRepo";

export const participantRepo = new PostgresParticipantRepository(Participant);
