export interface IException {
    type: string;
    message: string;
    statusCode: number;
}

export class Exception {
    public type: string;
    public message: string | any[];
    public statusCode: number;

    constructor(
        type: string,
        message: string | any[],
        statusCode = 400
    ) {
        this.type = type;
        this.message = message;
        this.statusCode = statusCode;
    }
}

/**
 * buildValidationErrors():
 */
export function buildValidationErrors(validationErrors: Object[]): string[] {
    let errors: any[] = [];
    for (let i = 0; i < validationErrors.length; i++) {
        const msg: string = (<any>validationErrors[i]).message;
        const key: string = (<any>validationErrors[i]).path[0];
        if (msg) errors.push({ field: key, message: msg.replace(/"/g, "'") });
    }
    return errors;
}
