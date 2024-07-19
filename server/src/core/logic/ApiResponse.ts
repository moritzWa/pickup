import { Response } from "express";

export type Info = {
    type: string; // "success" or "error"
    body: any;
    statusCode: number;
};

/**
 * This class handles formatting response to send back
 * to the client.
 */
export default class ApiResponse {
    public type: string;
    public body: any;
    public statusCode: number;

    constructor(info: Info) {
        this.type = info.type;
        this.body = info.body;
        this.statusCode = info.statusCode;
    }

    /**
     * Sends back response to client.
     * @param res The express response
     */
    send(res: Response): void {
        res.status(this.statusCode).send({
            type: this.type,
            ...this.body
        });
    }

    /**
     * Makes an success ApiResponse.
     *
     * @param statusCode Status code
     * @param body The body to send back.
     */
    static success(statusCode = 200, body: any) {
        return new ApiResponse({
            type: "success",
            body: body,
            statusCode: statusCode
        });
    }

    /**
     * Makes an error ApiResponse.
     *
     * @param statusCode Status code
     * @param body The body to send back.
     */
    static error(statusCode = 400, body: any) {
        return new ApiResponse({
            type: "error",
            body: body,
            statusCode: statusCode
        });
    }
}
