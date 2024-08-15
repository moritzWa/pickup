import { Content, User } from "src/core/infra/postgres/entities";
import { TranscribeService } from "./transcribeService";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import OpenAI from "openai";
import { firebase, openai } from "src/utils";
import { contentSessionRepo } from "../infra";
import { v4 as uuidv4 } from "uuid";

export type RespondData = {
    transcription: string;
    response: string;
    responseAudioUrl: string;
};

const respond = async (
    lesson: any,
    audioFileUrl: string
): Promise<FailureOrSuccess<DefaultErrors, RespondData>> => {
    const transcriptionResponse = await TranscribeService.transcribeAudioUrl(
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
            content: "",
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
        transcription: "",
        response: response,
        responseAudioUrl: upload.originalUrl,
    });
};

const respondToContent = async (
    content: Content,
    user: User,
    audioFileUrl: string
): Promise<FailureOrSuccess<DefaultErrors, RespondData>> => {
    const contentSessionResponse =
        await contentSessionRepo.findForContentAndUser({
            contentId: content.id,
            userId: user.id,
        });

    if (contentSessionResponse.isFailure()) {
        return failure(contentSessionResponse.error);
    }

    const contentSession = contentSessionResponse.value;

    // const messagesResponse = await contentMessageRepo.findForContentAndUser({
    //     contentId: content.id,
    //     userId: user.id,
    // });

    // if (messagesResponse.isFailure()) {
    //     return failure(messagesResponse.error);
    // }

    const messages = []; // messagesResponse.value;

    const transcriptionResponse = await TranscribeService.transcribeAudioUrl(
        audioFileUrl
    );

    if (transcriptionResponse.isFailure()) {
        return failure(transcriptionResponse.error);
    }

    const transcription = transcriptionResponse.value;

    const messageParams: OpenAI.Chat.ChatCompletionMessageParam[] = [
        // an AI language learning tutor talking to a student. this is what they say. prompt something back so they learn something
        {
            role: "system",
            content: `Here is a piece of content by ${content.authors
                .map((author) => author.name)
                .join(", ")}: ${content.context}`,
        },
        {
            role: "system",
            content: `Background: You are a tutor who wants to help teach this content.`,
        },
        // ...messages.map(
        //     (message): OpenAI.Chat.ChatCompletionMessageParam => ({
        //         role: message.isBot ? "assistant" : "user",
        //         content: message.message,
        //     })
        // ),
        {
            role: "user",
            content: "",
        },
    ];

    const messageResponse = await openai.chat.completions.create(messageParams);

    if (messageResponse.isFailure()) {
        return failure(messageResponse.error);
    }

    const response = messageResponse.value.choices[0].message.content || "";

    if (!response) {
        return failure(new Error("No response from AI"));
    }

    const speechAudioResponse = await openai.audio.speak({
        voice: "onyx",
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

    // save the user message + the bot response

    // await contentMessageRepo.create({
    //     audioUrl: audioFileUrl,
    //     id: uuidv4(),
    //     contentId: content.id,
    //     contentSessionId: contentSession.id,
    //     isBot: false,
    //     message: transcription,
    //     userId: user.id,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    // });

    // await contentMessageRepo.create({
    //     audioUrl: upload.originalUrl,
    //     id: uuidv4(),
    //     contentId: content.id,
    //     contentSessionId: contentSession.id,
    //     isBot: true,
    //     message: response,
    //     userId: user.id,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    // });

    return success({
        transcription: "",
        response: response,
        responseAudioUrl: upload.originalUrl,
    });
};

export const ResponseService = {
    respond,
    respondToContent,
};
