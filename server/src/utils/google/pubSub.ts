import { config } from "src/config";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import {
    PubSub,
    Message,
    ServiceError,
    ClientConfig,
} from "@google-cloud/pubsub";
import { PublishOptions } from "@google-cloud/pubsub/build/src/topic";
import { Helpers } from "../helpers";

const pubsubConfig: ClientConfig = {
    projectId: config.google.projectId,
    credentials: {
        private_key: config.google.privateKey,
        client_email: config.google.clientEmail,
    },
};

const pubsub = new PubSub(pubsubConfig);

export type OnMessage<T> = (message: Message, data: T) => Promise<void>;

export type OnError = (error: ServiceError) => void;

export type Publish<T> = (
    data: T
) => Promise<FailureOrSuccess<unknown, string>>;

export type PubSubTopicResponse<T> = {
    publish: Publish<T>;
    listen: () => void;
    exit: () => void;
};

type PubSubAbility = "listen" | "publish";

const PubSubTopic =
    ({
        topicName,
        subscriptionName,
        abilities,
        defaultOptions,
    }: {
        topicName: string;
        subscriptionName: string;
        abilities: PubSubAbility[];
        defaultOptions?: PublishOptions;
    }) =>
    <T>({
        onMessage,
        onError,
    }: {
        onMessage?: OnMessage<T>;
        onError?: OnError;
    }): PubSubTopicResponse<T> => {
        const subscription = pubsub
            .topic(topicName)
            .subscription(subscriptionName);

        const publish = async (
            data: T,
            options?: PublishOptions
        ): Promise<FailureOrSuccess<unknown, string>> => {
            if (!abilities.includes("publish")) {
                throw new Error(`cannot publish from client for ${topicName}`);
            }

            const dataStrRes = Helpers.maybeStringifyJSON(data);

            if (dataStrRes.isFailure()) {
                return dataStrRes;
            }

            const dataBuffer = Buffer.from(dataStrRes.value);

            try {
                const messageId = await pubsub
                    .topic(topicName, options || defaultOptions)
                    .publish(dataBuffer);

                console.log(`[published to ${topicName} msg ${messageId}]`);

                return success(messageId);
            } catch (err) {
                return failure(err);
            }
        };

        const listen = (): void => {
            if (!abilities.includes("listen")) {
                throw new Error(`cannot listen from client for ${topicName}`);
            }

            if (!onMessage) {
                return;
            }

            console.log(`[listening for ${subscriptionName}]`);

            subscription.on("message", (message: Message): void => {
                const dataResponse = Helpers.maybeParseJSON<any>(
                    message.data.toString()
                );

                if (dataResponse.isFailure()) {
                    message.ack();
                    return;
                }

                void onMessage(message, dataResponse.value).then(() =>
                    message.ack()
                );
            });

            if (!onError) {
                return;
            }

            subscription.on("error", onError);
        };

        const exit = (): void => {
            subscription.removeAllListeners();
        };

        return {
            publish,
            listen,
            exit,
        };
    };

export type PubSubTopic = ReturnType<typeof PubSubTopic>;
export { PubSubTopic };
