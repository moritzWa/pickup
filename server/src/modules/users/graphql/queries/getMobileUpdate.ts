import {
    list,
    mutationField,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { config } from "src/config";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { ReferralService } from "src/modules/referral/services/referralService";

export const GetMobileUpdateResponse = objectType({
    name: "GetMobileUpdateResponse",
    definition: (t) => {
        t.nullable.string("userVersion");
        t.nullable.string("latestVersion");
        t.nonNull.boolean("shouldUpdate");
    },
});

export const getMobileUpdate = queryField("getMobileUpdate", {
    type: nonNull("GetMobileUpdateResponse"),
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const userVersion = user.mobileAppVersion;
        const latestVersion = config.mobile.latestVersion;
        const shouldUpdate = isVersionLessThan(userVersion, latestVersion);

        return {
            userVersion,
            latestVersion,
            shouldUpdate,
        };
    },
});

export function isVersionLessThan(
    version1: string | null,
    version2: string | null
): boolean {
    // if either is null, don't do the comparison
    if (!version1 || !version2) {
        return false;
    }

    function versionToArray(version: string) {
        return version
            .replace(
                // remove all letters
                /[a-zA-Z]/g,
                ""
            )
            .split(".")
            .map(Number);
    }

    const v1Array = versionToArray(version1);
    const v2Array = versionToArray(version2);

    for (let i = 0; i < Math.max(v1Array.length, v2Array.length); i++) {
        const v1Part = v1Array[i] || 0;
        const v2Part = v2Array[i] || 0;

        if (v1Part < v2Part) {
            return true;
        } else if (v1Part > v2Part) {
            return false;
        }
    }
    return false;
}
