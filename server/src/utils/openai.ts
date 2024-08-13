import OpenAI from "openai";
import { config } from "src/config";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import * as fs from "fs";
import { SpeechCreateParams } from "openai/resources/audio/speech";

export enum OpenAIModel {
    GPT3 = "gpt-3.5-turbo",
    GPT4Mini = "gpt-4o-mini",
}

const client = new OpenAI({
    apiKey: config.openai.apiKey,
});

const createCompletion = async (
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<
    FailureOrSuccess<DefaultErrors, OpenAI.Chat.Completions.ChatCompletion>
> => {
    try {
        const completion = await client.chat.completions.create({
            messages,
            model: OpenAIModel.GPT4Mini,
        });

        return success(completion);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const transcribeAudio = async (
    audioStream: fs.ReadStream
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    try {
        const transcription = await client.audio.transcriptions.create({
            file: audioStream,
            model: "whisper-1",
            response_format: "json",
        });

        return success(transcription.text);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

//use whisper to generate speech response
const generateSpeech = async ({
    model = "tts-1",
    voice,
    text,
}: {
    text: string;
    voice: SpeechCreateParams["voice"];
    model: string;
}): Promise<FailureOrSuccess<DefaultErrors, Buffer>> => {
    try {
        const mp3 = await client.audio.speech.create({
            model: model,
            voice: voice,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return success(buffer);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getEmbeddings = async (
    query: string
): Promise<FailureOrSuccess<DefaultErrors, number[]>> => {
    try {
        const embedding = await client.embeddings.create({
            model: "text-embedding-3-large",
            dimensions: 256,
            input: query,
            encoding_format: "float",
        });

        const vector = embedding.data[0].embedding;

        return success(vector);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const openai = {
    embeddings: { create: getEmbeddings },
    chat: {
        completions: {
            create: createCompletion,
        },
    },
    audio: {
        transcribe: transcribeAudio,
        speak: generateSpeech,
    },
};
