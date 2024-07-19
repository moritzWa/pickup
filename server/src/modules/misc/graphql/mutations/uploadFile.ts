import { throwIfError } from "src/core/surfaces/graphql/common";
import { mutationField, nonNull, nullable, objectType } from "nexus";
import { publicBucket } from "src/shared/uploads";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { v4 as uuidv4 } from "uuid";
import BigNumber from "bignumber.js";

// 5mb file
const MEGABYTES = new BigNumber(2).pow(20);
const MAX_FILE_SIZE = MEGABYTES.multipliedBy(5).toNumber();

export const UploadFileResponse = objectType({
    name: "UploadFileResponse",
    definition(t) {
        t.nonNull.string("url");
        t.nonNull.string("objectFileKey");
        t.nonNull.string("fileName");
    },
});

export const uploadFile = mutationField("uploadFile", {
    type: nonNull("UploadFileResponse"),
    args: {
        file: nonNull("Upload"),
    },
    resolve: async (_p, { file }, ctx) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const { filename, createReadStream } = await file;

        const stream = createReadStream();

        const uploadStreamResponse = await publicBucket.uploadStream({
            fileName: `avatars/${user.id}-${uuidv4()}.png`,
            data: stream,
            contentType: "application/csv",
            maxFileSizeBytes: MAX_FILE_SIZE,
        });

        throwIfError(uploadStreamResponse);

        const upload = uploadStreamResponse.value;

        return {
            url: upload.url,
            fileName: filename,
            objectFileKey: upload.key,
        };
    },
});
