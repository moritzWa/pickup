import * as winston from "winston";

export const Logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.prettyPrint(),
                winston.format.printf(
                    (info) => `[${info.level}]: ${info.message}`
                )
            ),
        }),
    ],
});
