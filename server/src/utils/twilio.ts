import { config } from "src/config";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

const AUTH_TOKEN = config.twilio.authToken;
const VERIFY_SID = config.twilio.verifyServiceAccount;
const ACCOUNT_SID = config.twilio.accountSid;

const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

const sendCode = async (
    phoneNumber: string
): Promise<FailureOrSuccess<DefaultErrors, any>> => {
    try {
        const verification = await client.verify.v2
            .services(VERIFY_SID)
            .verifications.create({ to: phoneNumber, channel: "sms" });

        return success(verification);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const verifyCode = async (
    _phoneNumber: string,
    otpCode: string
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        // add a plus to phone number in front if there is none
        const phoneNumber =
            _phoneNumber.charAt(0) === "+" ? _phoneNumber : `+${_phoneNumber}`;

        console.log(`[checking ${phoneNumber} with code ${otpCode}]`);

        const verificationCheck = await client.verify.v2
            .services(VERIFY_SID)
            .verificationChecks.create({ to: phoneNumber, code: otpCode });

        console.log(verificationCheck);

        if (!verificationCheck.valid) {
            return failure(new Error("Invalid verification code."));
        }

        return success(null);
    } catch (err) {
        console.error(err);

        if ((err as any)?.code) {
            if ((err as any).code === 60200 && (err as any).status === 429) {
                return failure(
                    new Error("Max attempts reached. Try again later.")
                );
            }

            if ((err as any).code === 20404 && (err as any).status === 404) {
                return failure(
                    new Error(
                        "Phone verification session expired. Please resend the verification code."
                    )
                );
            }
        }
        return failure(new UnexpectedError(err));
    }
};

// docs: https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence
const phoneNumberIsAllowed = async (
    phoneNumber: string
): Promise<FailureOrSuccess<DefaultErrors, boolean>> => {
    try {
        const response = await client.lookups.v2
            .phoneNumbers(phoneNumber)
            .fetch({ fields: "line_type_intelligence" });

        const lineTypeIntelligence = response.lineTypeIntelligence;
        const type = lineTypeIntelligence.type;

        const isAllowed = type === "mobile" || type === "personal";

        return success(isAllowed);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const sendSMS = async (
    phoneNumber: string,
    message: string
): Promise<FailureOrSuccess<DefaultErrors, any>> => {
    try {
        const response = await client.messages.create({
            body: message,
            from: config.twilio.fromNumber,
            to: phoneNumber,
        });

        // console.log(response);

        return success(response);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const twilio = {
    verifyCode,
    sendCode,
    phoneNumberIsAllowed,
    sms: { send: sendSMS },
};
