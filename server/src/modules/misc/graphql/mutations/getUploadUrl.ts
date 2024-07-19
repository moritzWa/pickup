import { throwIfError } from "src/core/surfaces/graphql/common";
import { mutationField, nonNull, nullable, objectType } from "nexus";
import { publicBucket } from "src/shared/uploads";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { v4 as uuidv4 } from "uuid";
import BigNumber from "bignumber.js";

export const getUploadUrl = mutationField("getUploadUrl", {
    type: nonNull("UploadFileResponse"),
    resolve: async (_p, _args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const fileName = encodeURIComponent(`${user.id}-${uuidv4()}.jpg`);
        const objectKey = `avatars/${fileName}`;

        const uploadUrlResponse = await publicBucket.getSignedUploadUrl({
            objectKey: objectKey,
            contentType: "image/jpeg",
            signedUrlExpireSeconds: 60 * 60,
        });

        throwIfError(uploadUrlResponse);

        const uploadUrl = uploadUrlResponse.value;

        return {
            url: uploadUrl,
            fileName: fileName,
            objectFileKey: objectKey,
        };
    },
});
