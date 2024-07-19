import axios from "axios";
import { omit } from "lodash";
import { config, isProduction } from "src/config";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

const isProd = isProduction();

const client = axios.create({
    timeout: 30 * 1000,
    baseURL: "https://app.loops.so/api/v1",
    headers: {
        Authorization: `Bearer ${config.loops.apiKey}`,
    },
});

interface LoopsContactParams {
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    favoriteColor?: string;
    userGroup?: string;
    source?: string;
    userId: string;
}

const addContact = async (
    _params: LoopsContactParams & any
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        if (!isProd) {
            debugger;
            return success(null);
        }

        const fullName = _params.fullName;

        const firstName = fullName?.split(" ")[0] ?? undefined;
        const lastName = fullName?.split(" ")?.slice(1)?.join(" ") ?? undefined;

        console.log(`[sending to loop ${_params.email}]`);

        const params = {
            firstName,
            lastName,
            ..._params,
        };

        if (!params.email) {
            return failure(new Error("missing email for loops"));
        }

        const response = await client.post("/contacts/create", params);

        return success(null);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

const deleteContact = async (email: string) => {
    try {
        if (!isProd) {
            return success(null);
        }

        const response = await client.post("/contacts/delete", {
            email,
        });

        return success(null);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

const updateContact = async (
    _params: LoopsContactParams & any
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        if (!isProd) {
            return success(null);
        }

        const fullName = _params.fullName;

        const firstName = fullName?.split(" ")[0] ?? undefined;
        const lastName = fullName?.split(" ")?.slice(1)?.join(" ") ?? undefined;

        const params = {
            firstName,
            lastName,
            ..._params,
        };

        console.log(`[updating loop ${_params.email}]`);

        if (!params.email) {
            return failure(new Error("missing email for loops"));
        }

        const response = await client.put("/contacts/update", params);

        return success(null);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

const sendEvent = async (email: string, eventName: string) => {
    try {
        if (!isProd) {
            return success(null);
        }

        if (!email) {
            return failure(new Error("missing email for loops"));
        }

        const response = await client.post("/events/send", {
            email,
            eventName,
        });

        return success(null);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

export const loops = {
    contacts: {
        create: addContact,
        update: updateContact,
        delete: deleteContact,
    },
    events: { send: sendEvent },
};
