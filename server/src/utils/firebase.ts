import * as FirebaseClient from "firebase-admin";
import { config } from "../config";
import axios from "axios";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { v4 as uuidv4 } from "uuid";

const Firebase = FirebaseClient.initializeApp({
    storageBucket: config.firebase.storageBucket,
    credential: FirebaseClient.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
    }),
});

async function uploadImageToFirebase(
    imageUrl: string
): Promise<
    FailureOrSuccess<DefaultErrors, { originalUrl: string; thumbUrl: string }>
> {
    try {
        const bucket = Firebase.storage().bucket();

        // Fetch image from URL
        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "arraybuffer",
        });

        const buffer = Buffer.from(response.data, "binary");
        const contentType = response.headers["content-type"];
        const extension = contentType.split("/")[1];

        // Define file name and path
        const fileId = uuidv4();
        const name = `images/${fileId}.${extension}`;
        const file = bucket.file(name);

        // Upload the image to Firebase Storage
        await file.save(buffer, {
            contentType: contentType,
            metadata: {
                firebaseStorageDownloadTokens: uuidv4(), // Enable public access
            },
        });

        // add the _200x200 in front of the .png or .jpeg etc...
        const thumbnailFileName = `images/${fileId}_200x200.${extension}`;

        // Get URLs for the original and resized images
        const originalUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
        }/o/${encodeURIComponent(name)}?alt=media`;
        const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
        }/o/${encodeURIComponent(thumbnailFileName)}?alt=media`;

        return success({ originalUrl, thumbUrl });
    } catch (error) {
        debugger;

        return failure(new UnexpectedError(error));
    }
}

export { Firebase };

export const firebase = {
    storage: { upload: uploadImageToFirebase },
};
