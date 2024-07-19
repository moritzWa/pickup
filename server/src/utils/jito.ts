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

const JITO_BASE_URL = "ny.mainnet.block-engine.jito.wtf";
const MEMO_PROGRAM_PUB_KEY = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo";
const TIP_ACCOUNT_PUB_KEY = "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh";

const jitoKeypair = Keypair.fromSecretKey(
    bs58.decode(config.awakenFeePayer.privateKey)
);

const client = axios.create({
    baseURL: `https://${JITO_BASE_URL}`,
    headers: {
        "Content-Type": "application/json",
    },
});

export class BundleError extends Error {
    constructor(public bundle: BundleResult, public error: any) {
        super("Bundle error");
    }
}

const _buildBundle = (
    blockhash: string,
    bundleTransactionLimit: number,
    rawTxn: Uint8Array
): Bundle => {
    const tx = VersionedTransaction.deserialize(rawTxn);
    const b = new Bundle([tx], bundleTransactionLimit);

    let maybeBundle = b.addTransactions(
        buildMemoTransaction(jitoKeypair, blockhash)
    );

    if (isError(maybeBundle)) {
        throw maybeBundle;
    }

    maybeBundle = maybeBundle.addTipTx(
        jitoKeypair,
        500_000,
        new PublicKey(TIP_ACCOUNT_PUB_KEY),
        blockhash
    );

    if (isError(maybeBundle)) {
        throw maybeBundle;
    }

    return maybeBundle;
};

const sendBundle = async (
    rawTransactions: Uint8Array[],
    blockhash: string
): Promise<FailureOrSuccess<DefaultErrors | BundleError, any>> => {
    try {
        const bundleTransactionLimit = 3;

        const start = Date.now();
        const service = searcher.searcherClient(JITO_BASE_URL, jitoKeypair);

        console.log(`[using blockhash ${blockhash}]`);

        const bundles = rawTransactions.map((rt) =>
            _buildBundle(blockhash, bundleTransactionLimit, rt)
        );

        console.log(`[sending ${bundles.length} bundles]`);

        // for each bundle, send it
        for (const bundle of bundles) {
            const bundleId = await service.sendBundle(bundle);
            console.log(`Bundle ID: ${bundleId}`);
        }

        return success(null);
    } catch (err) {
        // console.log(err);
        const e = err as any;
        // console.log(e.message);
        // console.log(e.code);
        // console.log(e.status);

        if (
            e.code === 3 &&
            e.message.toLowerCase().includes("decoded message is too large")
        ) {
            return failure(
                new UnexpectedError(
                    new Error(
                        "Transaction size too large to be submitted to Solana."
                    ),
                    e
                )
            );
        }

        return failure(new UnexpectedError(err));
    }
};

// const _checkBundleStatusAndResubmit = async (
//     bundleId: string,
//     resendBundle: () => Promise<string>
// ) => {
//     // continuously check the status of the bundle

//     let counter = 0;

//     while (true) {
//         // kill switch at 60 counter
//         if (counter > 10) {
//             return failure(new Error("Bundle not confirmed"));
//         }

//         const response = await getBundleStatus(bundleId);

//         if (response.isSuccess()) {
//             console.log(response.value);

//             const noTxns =
//                 !response.value.result.value ||
//                 response.value.result.value[0] === null;

//             if (noTxns) {
//                 // try and resubmit
//                 await resendBundle();
//             }

//             const hasTxns =
//                 response.value.result.value &&
//                 response.value.result.value[0] !== null;

//             if (hasTxns) {
//                 break;
//             }
//         }

//         counter += 1;

//         await sleep(1000);
//     }

//     return success(true);
// };

const getBundleStatus = async (bundleId: string) => {
    try {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            id: "movement",
            method: "getBundleStatuses",
            params: [[bundleId]],
        });

        const response = await client.post("/api/v1/bundles", data);

        return success(response.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const sendBundleWithRetry = async (
    rawTransactions: Uint8Array[],
    blockhash: string
): Promise<FailureOrSuccess<DefaultErrors, any>> => {
    let response = await sendBundle(rawTransactions, blockhash);

    // retry it up to 3 times with a 500ms pause in between
    let retries = 0;

    while (response.isFailure() && retries < 3) {
        await sleep(500);

        response = await sendBundle(rawTransactions, blockhash);

        retries += 1;
    }

    return response;
};

const buildMemoTransaction = (
    keypair: Keypair,
    recentBlockhash: string
): VersionedTransaction => {
    const ix = new TransactionInstruction({
        keys: [
            {
                pubkey: keypair.publicKey,
                isSigner: true,
                isWritable: true,
            },
        ],
        programId: new PublicKey(MEMO_PROGRAM_PUB_KEY),
        data: Buffer.from("Jito Backrun"),
    });

    const instructions = [ix];

    const messageV0 = new TransactionMessage({
        payerKey: keypair.publicKey,
        recentBlockhash: recentBlockhash,
        instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    tx.sign([keypair]);

    return tx;
};

const tipJITO = (payerPubKey: PublicKey) => {
    return SystemProgram.transfer({
        fromPubkey: new PublicKey(payerPubKey),
        toPubkey: new PublicKey(
            "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh" // Jito tip account
        ),
        lamports: 500_000, // tip
    });
};

export const jito = {
    bundles: { send: sendBundle, sendWithRetry: sendBundleWithRetry },
    tipInstruction: tipJITO,
};
