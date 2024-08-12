import * as winston from "winston";

const MAX_MESSAGE_LENGTH = 2000;

const customFormat = winston.format.printf(({ level, message }) => {
    return `[${level}]: ${message}`;
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
