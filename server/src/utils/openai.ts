import OpenAI from "openai";
import { config } from "src/config";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

export enum OpenAIModel {
    GPT3 = "gpt-3.5-turbo",
    GPT4Mini = "gpt-4o-mini",
}

const client = new OpenAI({
    apiKey: config.openai.apiKey,
});

const createCompletion = async (): Promise<
    FailureOrSuccess<DefaultErrors, OpenAI.Chat.Completions.ChatCompletion>
> => {
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
            ],
            model: OpenAIModel.GPT4Mini,
        });

        return success(completion);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const openai = {
    chat: {
        completions: {
            create: createCompletion,
        },
    },
};
