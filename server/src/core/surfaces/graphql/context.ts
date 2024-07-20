import { Maybe, NotFoundError } from "src/core/logic";
import { propOr } from "lodash/fp";
import { User } from "src/core/infra/postgres/entities";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { NextFunction, Request, Response } from "express";
import { ApolloError, ContextFunction } from "apollo-server-core";
import { ExpressContext } from "apollo-server-express";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import { StatusCodes } from "http-status-codes";
import { MagicUserMetadata } from "@magic-sdk/admin";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { IncomingHttpHeaders } from "http";
import { isString } from "lodash";
import { throwIfError } from "./common";

export type Context = {
    authedUser: Maybe<User>; // the user who is authed to make the request
    // the user who we are treating as the "me". for all users authed = me
    // but for admins the authed can be the admin. but the me can be a different user used for debugging purposes
    me: Maybe<User>;
    authProvider: Maybe<UserAuthProvider>;
    authProviderId: Maybe<string>;
    errorType: Maybe<string>;
    isAuthorized: boolean;
    message: Maybe<string>;
};

export type AuthenticatedContext = Context & {
    user: User;
    magicUser: MagicUserMetadata;
};

const buildContext = async (
    authorization: string | null,
    headers: IncomingHttpHeaders
): Promise<Context> => {
    if (!authorization) {
        return {
            authedUser: null,
            me: null,
            authProvider: null,
            authProviderId: null,
            errorType: "Unauthorized",
            isAuthorized: false,
            message: "Missing authorization header.",
        };
    }

    // this is for an admin user who wants to pretend to be another user
    const xUserEmail = headers["x-user-email"];
    const xAppVersion = headers["x-app-version"];
    const xDeviceId = headers["x-device-id"];
    const xMobilePlatform = headers["x-mobile-platform"];
    const isViewingAsUser = !!xUserEmail && isString(xUserEmail);

    const authParts = authorization.split(" ");

    if (authParts.length !== 2) {
        return {
            authedUser: null,
            me: null,
            authProvider: null,
            authProviderId: null,
            errorType: "Unauthorized",
            isAuthorized: false,
            message: "Invalid authorization header.",
        };
    }

    const token = authParts[1];

    try {
        const firebaseResponse = await FirebaseProvider.verifyToken(token);

        if (firebaseResponse.isFailure()) {
            return {
                authProvider: null,
                authProviderId: null,
                errorType: "Forbidden",
                isAuthorized: false,
                authedUser: null,
                me: null,
                message: firebaseResponse.error.message,
            };
        }

        const decodedToken = firebaseResponse.value;

        const response = await pgUserRepo.findByFirebaseUid(decodedToken.uid);

        if (response.isFailure()) {
            if (response.error instanceof NotFoundError) {
                return {
                    errorType: "Forbidden",
                    isAuthorized: false,
                    authedUser: null,
                    me: null,
                    authProviderId: decodedToken.uid,
                    authProvider: UserAuthProvider.Firebase,
                    message: "No user with this uid.",
                };
            }

            return {
                errorType: "Forbidden",
                isAuthorized: false,
                authedUser: null,
                me: null,
                authProviderId: decodedToken.uid,
                authProvider: UserAuthProvider.Firebase,
                message: "Unknown error occurred: " + response.error.message,
            };
        }

        let me = response.value;
        let authedUser = response.value;

        // these should only be updated on the authed user. so if we are looking at the user
        // from their account -> we don't see their location like that

        // only update this if not viewing as that user
        if (!isViewingAsUser) {
            if (xAppVersion || xDeviceId || xMobilePlatform) {
                // if the app version or device ID is different, build updates object
                const updates: Partial<User> = {
                    ...(xAppVersion && {
                        mobileAppVersion: xAppVersion as string,
                    }),
                    ...(xDeviceId && { mobileDeviceId: xDeviceId as string }),
                    ...(xMobilePlatform && {
                        mobilePlatform: xMobilePlatform as string,
                    }),
                };

                const shouldUpdate =
                    updates.mobileAppVersion !== authedUser.mobileAppVersion ||
                    updates.mobileDeviceId !== authedUser.mobileDeviceId ||
                    updates.mobilePlatform !== authedUser.mobilePlatform;

                if (shouldUpdate) {
                    // update the authed user and then overwrite it
                    // if different from authed user, update it
                    const userResponse = await pgUserRepo.update(
                        authedUser.id,
                        updates
                    );

                    if (userResponse.isSuccess()) {
                        me = userResponse.value;
                        authedUser = userResponse.value;
                    }
                }
            }
        }

        // if there is an x user ID and the authed user is super user,
        // set the me to be that user
        if (xUserEmail && authedUser.isSuperuser && isString(xUserEmail)) {
            const userResponse = await pgUserRepo.findByEmail(xUserEmail);

            if (userResponse.isSuccess()) {
                me = userResponse.value;
            }
        }

        return {
            errorType: null,
            isAuthorized: true,
            authedUser: authedUser,
            me: me,
            authProviderId: response.value.authProviderId,
            authProvider: UserAuthProvider.Firebase,
            message: null,
        };
    } catch (err) {
        return {
            errorType: "Forbidden",
            isAuthorized: false,
            authedUser: null,
            me: null,
            authProvider: null,
            authProviderId: null,
            message: propOr("Authorization failed.", "message", err),
        };
    }
};

export const createContext: ContextFunction<ExpressContext, object> = async ({
    req,
}: {
    req: Request;
}): Promise<Context> => {
    return buildContext(req.headers.authorization || "", req.headers);
};

export const isAuthorized = (ctx: Context) => !!ctx.me && ctx.isAuthorized;

export const throwIfNotAuthenticated = (ctx: Context) => {
    const user = ctx.me;

    if (!user) {
        throw new ApolloError(
            "Not logged in.",
            StatusCodes.UNAUTHORIZED.toString()
        );
    }
};

export const throwIfNotAdmin = (ctx: Context) => {
    const authedUser = ctx.authedUser;
    const user = ctx.me;

    if (!user || !authedUser) {
        throw new ApolloError(
            "Not logged in.",
            StatusCodes.UNAUTHORIZED.toString()
        );
    }

    if (!authedUser.isSuperuser) {
        throw new ApolloError("Forbidden.", StatusCodes.FORBIDDEN.toString());
    }
};

export const setAuthContext = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const context = await buildContext(
        req.headers.authorization || "",
        req.headers
    );

    res.locals.auth = context;

    return next();
};

export const enforceAuth = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    const auth = res.locals.auth;

    if (!auth || !auth.isAuthorized || !auth.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Not authorized.",
        });
    }

    return next();
};
