import { Token } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";

export const enqueueFirebaseUpload = async (
    token: Token,
    imageUrl: string | null
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        if (!imageUrl) {
            return success(null);
        }

        if (token.hasAddedToCdn) {
            return success(null);
        }

        await inngest.send({
            name: InngestEventName.UploadImageToFirebase,
            data: {
                tokenId: token.id,
                imageUrl: token.iconImageUrl || imageUrl,
            },
        });

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
