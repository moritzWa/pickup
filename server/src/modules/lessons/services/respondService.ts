import { Lesson } from "src/core/infra/postgres/entities";
import { TranscribeService } from "./transcribeService";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import OpenAI from "openai";
import { firebase, openai } from "src/utils";

export type RespondData = {
    transcription: string;
    response: string;
    responseAudioUrl: string;
};

const respond = async (
    lesson: Lesson,
    audioFileUrl: string
): Promise<FailureOrSuccess<DefaultErrors, RespondData>> => {
    const transcriptionResponse = await TranscribeService.transcribeAudioUrl(
        lesson,
        audioFileUrl
    );

    if (transcriptionResponse.isFailure()) {
        return failure(transcriptionResponse.error);
    }

    const transcription = transcriptionResponse.value;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        // an AI language learning tutor talking to a student. this is what they say. prompt something back so they learn something
        {
            role: "system",
            content:
                "Hello! I am your AI language learning tutor. I'm here to help you improve your language skills. Which language are you learning, and what specific aspect would you like to focus on today?",
        },
        {
            role: "user",
            content: transcription,
        },
    ];

    const messageResponse = await openai.chat.completions.create(messages);

    if (messageResponse.isFailure()) {
        return failure(messageResponse.error);
    }

    const response = messageResponse.value.choices[0].message.content || "";

    if (!response) {
        return failure(new Error("No response from AI"));
    }

    const speechAudioResponse = await openai.audio.speak({
        voice: "alloy",
        text: response,
        model: "tts-1",
    });

    if (speechAudioResponse.isFailure()) {
        return failure(speechAudioResponse.error);
    }

    const speech = speechAudioResponse.value;

    // write this buffer to firebase
    const uploadResponse = await firebase.storage.uploadBuffer(
        speech,
        // audio file
        "audio/mpeg"
    );

    if (uploadResponse.isFailure()) {
        return failure(uploadResponse.error);
    }

    const upload = uploadResponse.value;

    return success({
        transcription: transcription,
        response: response,
        responseAudioUrl: upload.originalUrl,
    });
};

export const ResponseService = {
    respond,
};
