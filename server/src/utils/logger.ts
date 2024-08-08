import * as winston from "winston";

const MAX_MESSAGE_LENGTH = 2000;

const truncateMessage = (message: string): string => {
    if (message.length <= MAX_MESSAGE_LENGTH) {
        return message;
    }
    return message.slice(0, MAX_MESSAGE_LENGTH) + "...[truncated]";
};

const customFormat = winston.format.printf(({ level, message }) => {
    const truncatedMessage = truncateMessage(message);
    return `[${level}]: ${truncatedMessage}`;
});

export const Logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.prettyPrint(),
                customFormat
            ),
        }),
    ],
});
