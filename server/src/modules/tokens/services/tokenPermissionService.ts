import { User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { pgTokenPermissionRepo } from "../postgres";
import { UserRole } from "src/core/infra/postgres/entities/User";

const hasPermission = async (
    user: User,
    tokenId: string
): Promise<FailureOrSuccess<DefaultErrors, boolean>> => {
    if (user.isSuperuser) {
        return success(true);
    }

    if (user.role === UserRole.BasicAdmin) {
        return success(true);
    }

    const hasPermissionResponse = await pgTokenPermissionRepo.exists({
        where: {
            userId: user.id,
            tokenId,
        },
    });

    if (hasPermissionResponse.isFailure()) {
        return failure(hasPermissionResponse.error);
    }

    const hasPermission = hasPermissionResponse.value;

    return success(hasPermission);
};

const throwIfNoPermission = async (
    user: User,
    tokenId: string
): Promise<void> => {
    const hasPermissionResponse = await hasPermission(user, tokenId);

    if (hasPermissionResponse.isFailure()) {
        throw hasPermissionResponse.error;
    }

    if (!hasPermissionResponse.value) {
        throw new Error("User does not have permission to access this token.");
    }

    return Promise.resolve();
};

export const TokenPermissionService = {
    hasPermission,
    throwIfNoPermission,
};
