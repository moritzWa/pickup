import { auth, FirebaseError } from "firebase-admin";
import { failure, FailureOrSuccess, success } from "src/core/logic";
import { UnexpectedError } from "src/core/logic/errors";
import { Firebase } from "src/utils";

const deleteUser = async (
    uid: string
): Promise<FailureOrSuccess<UnexpectedError, null>> => {
    try {
        await Firebase.auth().deleteUser(uid);

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const createUser = async (
    properties: auth.CreateRequest
): Promise<FailureOrSuccess<UnexpectedError, auth.UserRecord>> => {
    try {
        const fbUser = await Firebase.auth().createUser(properties);

        return success(fbUser);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const findUser = async (
    email: string
): Promise<FailureOrSuccess<UnexpectedError, auth.UserRecord>> => {
    try {
        const fbUser = await Firebase.auth().getUserByEmail(email);

        return success(fbUser);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const findUserByUid = async (
    uid: string
): Promise<FailureOrSuccess<UnexpectedError, auth.UserRecord>> => {
    try {
        const fbUser = await Firebase.auth().getUser(uid);

        return success(fbUser);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const findUserFromPhone = async (
    phoneNumber: string
): Promise<FailureOrSuccess<UnexpectedError, auth.UserRecord>> => {
    try {
        const fbUser = await Firebase.auth().getUserByPhoneNumber(phoneNumber);

        return success(fbUser);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const findUserOrCreate = async (
    email: string
): Promise<FailureOrSuccess<UnexpectedError, auth.UserRecord>> => {
    try {
        const fbUser = await Firebase.auth().getUserByEmail(email);

        return success(fbUser);
    } catch (err) {
        // if it is a firebase error type
        const error = err as FirebaseError;

        if (error?.code === "auth/user-not-found") {
            const fbUser = await createUser({
                email,
                emailVerified: false,
            });

            return fbUser;
        }

        return failure(new UnexpectedError(err));
    }
};

const findUserOrCreateForPhone = async (
    phoneNumber: string
): Promise<FailureOrSuccess<UnexpectedError, auth.UserRecord>> => {
    try {
        const fbUser = await Firebase.auth().getUserByPhoneNumber(phoneNumber);

        return success(fbUser);
    } catch (err) {
        // if it is a firebase error type
        const error = err as FirebaseError;

        if (error?.code === "auth/user-not-found") {
            const fbUser = await createUser({
                phoneNumber,
                emailVerified: false,
            });

            return fbUser;
        }

        return failure(new UnexpectedError(err));
    }
};

const verifyToken = async (
    token: string
): Promise<FailureOrSuccess<UnexpectedError, auth.DecodedIdToken>> => {
    try {
        const decodedToken = await Firebase.auth().verifyIdToken(token);

        return success(decodedToken);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const signToken = async (
    uid: string
): Promise<FailureOrSuccess<UnexpectedError, string>> => {
    try {
        const token = await Firebase.auth().createCustomToken(uid);

        return success(token);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const FirebaseProvider = {
    createUser,
    verifyToken,
    deleteUser,
    signToken,
    findUser,
    findUserOrCreate,
    findUserFromPhone,
    findUserOrCreateForPhone,
    findUserByUid,
};
