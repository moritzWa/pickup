import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { s3Bucket } from "src/utils/aws";

export const S3_FOLDERS = {
    GRAPH_RERUNS: "graph-reruns",
    RECALCULATE_SNAPSHOTS: "recalculate-snapshots",
    IMPORT_AUDIT_LOGS: "import-audit-logs",
    RECALCULATE_SPEEDUP: "recalculate-speedup",
    HARD_REFRESH_DIFFS: "hard-refresh-diffs",
};

const S3FoldersValues = Object.values(S3_FOLDERS);

export const getClientFolderPath = (
    clientId: string,
    folder: (typeof S3FoldersValues)[number],
    fileName: string
) => {
    // putting ${clientId} before ${folder} allows us to clear all files for a client
    return `clients/${clientId}/${folder}/${fileName}`;
};

// only use for the backend
export const getRealURLBackend = async (
    objectKey: string
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    // const signedUrlResponse = await secureBucket.signUrl({
    //     objectKey,
    //     expiresInSeconds: 60 * 60, // 1 hour expiration
    // });
    // if (signedUrlResponse.isFailure()) return failure(signedUrlResponse.error);

    // const signedUrl = signedUrlResponse.value;
    // return success(signedUrl.url);
    return failure(new Error("Not implemented"));
};

export const publicBucket = s3Bucket({
    name: "Public Movement Bucket",
    bucket: "assets.movement.market",
    rootUrl: "https://assets.movement.market",
});

export const UploadService = {
    aws: { publicBucket },
};
