import {
    PublicKey,
    SystemProgram,
    Keypair,
    VersionedTransaction,
    TransactionMessage,
    TransactionInstruction,
} from "@solana/web3.js";
import axios from "axios";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { searcher } from "jito-ts";
import * as bs58 from "bs58";
import { Bundle } from "jito-ts/dist/sdk/block-engine/types";
import { connection } from "./helius/constants";
import { isError } from "jito-ts/dist/sdk/block-engine/utils";
import { config } from "src/config";
import { helius } from "./helius";
import { Datadog, logHistogram } from "./datadog";
import { BundleResult } from "jito-ts/dist/gen/block-engine/bundle";
import { sleep } from "radash";

const ACCOUNT_ID = "2ea6fca5d1f5e1bc003c354fda273ccb";

const client = axios.create({
    baseURL: `https://api.cloudflare.com`,
    headers: {
        Authorization: `Bearer ${config.cloudflare.imageApiKey}`,
        // "X-Auth-Key": config.cloudflare.imageApiKey,
    },
});

const uploadImage = async (originalUrl: string) => {
    try {
        const formData = new FormData();

        formData.append("url", originalUrl);
        // formData.append('metadata', {});
        formData.append("requireSignedURLs", "false");

        const response = await client.post(
            `/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
            null,
            {
                data: formData,
                headers: {
                    Authorization: `Bearer ${config.cloudflare.imageApiKey}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        ("Request failed with status code 400");

        debugger;

        return response.data;
    } catch (err) {
        debugger;

        return failure(new UnexpectedError(err));
    }
};

export const cloudflare = {
    images: { upload: uploadImage },
};
