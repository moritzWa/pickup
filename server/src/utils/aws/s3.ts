import { config } from "src/config";
import { failure, FailureOrSuccess, Maybe, success } from "src/core/logic";
import {
    DefaultErrors,
    NotFoundError,
    UnexpectedError,
    ValidationError,
} from "src/core/logic/errors";
import { AWSError, S3 } from "aws-sdk";
import { Helpers } from "src/utils";
import * as stream from "stream";
import * as bytes from "bytes";

export type StorageClass =
    | "STANDARD"
    | "REDUCED_REDUNDANCY"
    | "STANDARD_IA"
    | "ONEZONE_IA"
    | "INTELLIGENT_TIERING"
    | "GLACIER"
    | "DEEP_ARCHIVE"
    | "OUTPOSTS"
    | "GLACIER_IR";

type S3Params = {
    bucket: string;
    region?: Maybe<string>;
    name: string;
    client: S3;
    rootUrl: string;
};

// upload
type S3UploadRequest = {
    fileName: string;
    data: Blob | string | ArrayBuffer;
    contentType?: string;
    storageClass?: StorageClass;
};

type S3UploadStreamRequest = {
    fileName: string;
    data: NodeJS.ReadableStream;
    contentType?: string;
    maxFileSizeBytes?: number;
    storageClass?: StorageClass;
};

export type S3UploadSuccessResponse = {
    url: string;
    key: string;
    bucket: string;
    fileName: string;
};

type S3UploadResponse = FailureOrSuccess<
    UnexpectedError | Error,
    S3UploadSuccessResponse
>;

// read
type S3ReadRequest = {
    objectKey: string;
};

type S3ReadSuccessResponse<T> = {
    data: T;
};

type S3ReadResponse<T> = FailureOrSuccess<
    UnexpectedError,
    S3ReadSuccessResponse<T>
>;

class S3Bucket {
    private readonly client: S3;
    public readonly name: string;
    public readonly bucket: string;
    public readonly region: string;
    public readonly rootUrl: string;

    constructor({ name, bucket, client, rootUrl, region }: S3Params) {
        this.name = name;
        this.bucket = bucket;
        this.client = client;
        this.region = client.config.region || region || "us-east-1";
        this.rootUrl = rootUrl;
    }

    upload = async ({
        fileName,
        data,
        contentType = "application/json",
        storageClass = "STANDARD",
    }: S3UploadRequest): Promise<S3UploadResponse> => {
        const upload: S3.PutObjectRequest = {
            Bucket: this.bucket,
            Key: fileName,
            Body: data,
            ContentType: contentType,
            StorageClass: storageClass,
        };

        try {
            const file = await this.client.upload(upload).promise();

            return success({
                url: file.Location,
                key: file.Key,
                fileName,
                bucket: this.bucket,
            });
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    // this is for uploading a data stream to s3 (uploading in chunks basically)
    uploadStream = async ({
        fileName,
        data,
        contentType = "application/json",
        maxFileSizeBytes,
        storageClass = "STANDARD",
    }: S3UploadStreamRequest): Promise<S3UploadResponse> => {
        const uploadStream = new stream.PassThrough();
        const validation = new stream.PassThrough();

        const upload: S3.PutObjectRequest = {
            Bucket: this.bucket,
            Key: fileName,
            Body: uploadStream,
            ContentType: contentType,
            StorageClass: storageClass,
        };

        try {
            // kick off the upload with the passthrough stream as the data source
            const fileResponse = this.client.upload(upload).promise();

            let byteLength: number = 0;

            if (maxFileSizeBytes && maxFileSizeBytes > 0) {
                data.pipe(validation).on("data", (data: Buffer) => {
                    byteLength += data.byteLength;

                    // Once file size gets too big, kill all streams and halt the upload
                    if (byteLength > maxFileSizeBytes) {
                        const size = bytes(maxFileSizeBytes);
                        const message = `Upload exceeds the maximum allowed size of ${size}!`;

                        uploadStream.destroy(new Error(message));

                        return failure(new ValidationError(message));
                    }
                });
            }

            // start piping the data stream into the passthrough stream
            // so it gets uploaded to s3
            data.pipe(uploadStream);

            // wait for the upload to finish after the pipe is done before returning
            const file = await fileResponse;

            return success({
                url: file.Location,
                key: file.Key,
                fileName,
                bucket: this.bucket,
            });
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    exists = async <T>({
        objectKey,
    }: S3ReadRequest): Promise<FailureOrSuccess<DefaultErrors, null>> => {
        try {
            const file = await this.client
                .headObject({
                    Bucket: this.bucket,
                    Key: objectKey,
                })
                .promise();

            const fileExists = file.ContentLength !== undefined;

            if (!fileExists) {
                return failure(new NotFoundError("File does not exist"));
            }

            return success(null);
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    getSignedUploadUrl = async ({
        objectKey,
        contentType,
        signedUrlExpireSeconds,
    }: {
        objectKey: string;
        contentType: string;
        signedUrlExpireSeconds: number;
    }): Promise<FailureOrSuccess<DefaultErrors, string>> => {
        try {
            const url = await this.client.getSignedUrl("putObject", {
                Bucket: this.bucket,
                Key: objectKey,
                ACL: "public-read",
                ContentType: contentType,
            });

            return success(url);
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    read = async <T>({
        objectKey,
    }: S3ReadRequest): Promise<S3ReadResponse<T>> => {
        try {
            const file = await this.client
                .getObject({
                    Bucket: this.bucket,
                    Key: objectKey,
                })
                .promise();

            if (file.ContentType === "application/json") {
                const data = Helpers.maybeParseJSON(
                    file.Body?.toString() || null
                );

                if (data.isFailure()) {
                    return failure(new UnexpectedError(data.error));
                }

                return success({ data: data.value as T });
            }

            return success({ data: file.Body as unknown as T });
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    readStream = ({
        objectKey,
    }: S3ReadRequest): FailureOrSuccess<DefaultErrors, stream.Readable> => {
        try {
            const stream = this.client
                .getObject({
                    Bucket: this.bucket,
                    Key: objectKey,
                })
                .createReadStream();

            return success(stream);
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    delete = async <T>({
        objectKey,
    }: S3ReadRequest): Promise<
        FailureOrSuccess<DefaultErrors, S3.DeleteObjectsOutput>
    > => {
        try {
            const file = await this.client
                .deleteObject({
                    Bucket: this.bucket,
                    Key: objectKey,
                })
                .promise();

            return success(file);
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };

    signUrl = async ({
        objectKey,
        expiresInSeconds,
    }: {
        objectKey: string;
        expiresInSeconds: number;
    }): Promise<FailureOrSuccess<UnexpectedError, { url: string }>> => {
        try {
            const url = await this.client.getSignedUrlPromise("getObject", {
                Key: objectKey,
                Bucket: this.bucket,
                Expires: expiresInSeconds,
            });

            return success({ url });
        } catch (err) {
            return failure(new UnexpectedError(err as AWSError));
        }
    };
}

const _s3Bucket = (client: S3) => (args: Omit<S3Params, "client">) =>
    new S3Bucket({
        ...args,
        client,
    });

const params: S3.ClientConfiguration = {
    credentials: {
        accessKeyId: config.aws.accessKey,
        secretAccessKey: config.aws.secretKey,
    },
    region: config.aws.region,
    signatureVersion: "v4",
};

const s3Client = new S3(params);

const s3Bucket = _s3Bucket(s3Client);

export { s3Bucket, S3Bucket, s3Client };
