import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog, firebase } from "src/utils";
import { Slack, SlackChannel } from "src/utils/slack";
import { trackError } from "src/utils/trackDatadog";
import { inngest } from "../clients";
import {
    InngestEventName,
    SubmitTransactionData,
    SubmitWithdrawalData,
} from "../types";
import { NonRetriableError, slugify } from "inngest";
import { tokenRepo } from "src/modules/trading/infra/postgres";

const NAME = "Upload Image To Firebase";
const RETRIES = 3;

const uploadImageToFirebase = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: {
            limit: 25,
        },
        rateLimit: {
            limit: 1,
            period: "1m",
            key: "event.data.tokenId",
        },
        retries: RETRIES,
    },
    { event: InngestEventName.UploadImageToFirebase },
    async ({ event, step, runId }) => {
        // console.info(`[uploading tokens image ${runId}]`);

        const data = event.data;

        const images = await step.run("upload-image", () => _uploadImage(data));

        await step.run("save-token", () =>
            _saveImageForToken(data.tokenId, images)
        );
    }
);

const _uploadImage = async (data: { imageUrl: string }) => {
    const response = await firebase.storage.upload(data.imageUrl);

    if (response.isFailure()) {
        throw response.error;
    }

    console.log(`[successfully uploaded image to firebase]`);
    // console.log(`[original url: ${response.value.originalUrl}]`);

    return response.value;
};

const _saveImageForToken = async (
    tokenId: string,
    images: {
        originalUrl: string;
        thumbUrl: string;
    }
) => {
    const response = await tokenRepo.findById(tokenId);

    if (response.isFailure()) {
        throw response.error;
    }

    const token = response.value;

    if (token.hasAddedToCdn) {
        console.log(`[token ${tokenId} already has image saved]`);

        return Promise.resolve();
    }

    const updateResponse = await tokenRepo.update(tokenId, {
        hasAddedToCdn: true,
        cdnHeroImageUrl: images.originalUrl,
        cdnThumbnailImageUrl: images.thumbUrl,
        cdnOriginalImageUrl: images.originalUrl,
    });

    if (updateResponse.isFailure()) {
        throw updateResponse.error;
    }

    console.log(`[successfully saved image for token ${tokenId}]`);

    return Promise.resolve();
};

export default uploadImageToFirebase;
