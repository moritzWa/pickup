import { Course, User } from "src/core/infra/postgres/entities";
import { participantRepo } from "../infra";
import {
    Participant,
    ParticipantStatus,
} from "src/core/infra/postgres/entities/Participant";
import { v4 as uuidv4 } from "uuid";
import { dataSource } from "src/core/infra/postgres";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

export type CreateParticipantsData = {
    userParticipant: Participant;
    botParticipant: Participant;
};

const createParticipants = async (
    course: Course,
    user: User
): Promise<FailureOrSuccess<DefaultErrors, CreateParticipantsData>> => {
    try {
        let userParticipant: Participant | null = null;
        let botParticipant: Participant | null = null;

        await dataSource.transaction(async (dbTxn) => {
            const userParticipantResponse = await participantRepo.create(
                {
                    id: uuidv4(),
                    status: ParticipantStatus.Active,
                    isBot: false,
                    characterId: null,
                    userId: user.id,
                    courseId: course.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                dbTxn
            );

            if (userParticipantResponse.isFailure()) {
                throw new Error("Failed to create user participant");
            }

            const botParticipantResponse = await participantRepo.create(
                {
                    id: uuidv4(),
                    status: ParticipantStatus.Active,
                    isBot: true,
                    characterId: course.defaultCharacterId,
                    userId: null,
                    courseId: course.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                dbTxn
            );

            if (botParticipantResponse.isFailure()) {
                console.log(botParticipantResponse);
                throw new Error("Failed to create bot participant");
            }

            userParticipant = userParticipantResponse.value;
            botParticipant = botParticipantResponse.value;
        });

        if (!userParticipant || !botParticipant) {
            return failure(
                new UnexpectedError("Failed to create participants")
            );
        }

        return success({
            userParticipant,
            botParticipant,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const ParticipantService = {
    createParticipants,
};
