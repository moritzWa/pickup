import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    AddressLookupTableProgram,
    ComputeBudgetProgram,
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import { connect } from "src/core/infra/postgres";
import { jito } from "src/utils";
import { connection } from "src/utils/helius/constants";
import { WRAPPED_SOL_MINT, solana } from "src/utils/solana";

const _makeLookupTable = async () => {
    const slot = await connection.getSlot();
    const { blockhash } = await connection.getLatestBlockhash();

    const payer = solana.getMovementFeePayerKeypair();

    if (!payer) {
        return;
    }

    const [lookupTableInst, lookupTableAddress] =
        AddressLookupTableProgram.createLookupTable({
            authority: payer.publicKey,
            payer: payer.publicKey,
            recentSlot: slot,
        });

    console.log("lookup table address:", lookupTableAddress.toBase58());

    debugger;

    // make priority fee instructions

    const txn = new TransactionMessage({
        instructions: [lookupTableInst],
        payerKey: payer.publicKey,
        recentBlockhash: blockhash,
    });

    const msgV0 = txn.compileToV0Message();

    const versionTxn = new VersionedTransaction(msgV0);

    versionTxn.sign([payer]);

    const sig = await jito.bundles.send([versionTxn.serialize()], blockhash);

    console.log("transaction signature:", sig);
};
const run = async () => {
    // connect to a cluster and get the current `slot`
    const slot = await connection.getSlot();
    const { blockhash } = await connection.getLatestBlockhash();

    const payer = solana.getMovementFeePayerKeypair();

    if (!payer) {
        return;
    }

    // https://solscan.io/account/7nhc4ubxPbWoBcqMUNDy7zgfRCKG92ZhE6svmiT4mtku
    debugger;

    const lookupTableAddress = new PublicKey(
        "7nhc4ubxPbWoBcqMUNDy7zgfRCKG92ZhE6svmiT4mtku"
    );

    const extendInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: payer.publicKey,
        authority: payer.publicKey,
        lookupTable: lookupTableAddress,
        addresses: [
            payer.publicKey,
            SystemProgram.programId,
            ComputeBudgetProgram.programId,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
            // our revenue account
            new PublicKey("muLap14LG1yP6qTerDVooZqf4zbwVZaWVK1KMCzheEd"),
            // our USDC account
            new PublicKey("HXeEwaqo4s78y2Gtv8JKHNfd6fNx3RhkmiyPSzBfU8MJ"), // our USDC program
            // USDC
            new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
            // SOL
            new PublicKey(WRAPPED_SOL_MINT),
        ],
    });

    // make a transaction and send it, again

    const txn2 = new TransactionMessage({
        instructions: [extendInstruction],
        payerKey: payer.publicKey,
        recentBlockhash: blockhash,
    });

    const msgV02 = txn2.compileToV0Message();

    const versionTxn2 = new VersionedTransaction(msgV02);

    versionTxn2.sign([payer]);

    const sig2 = await jito.bundles.send([versionTxn2.serialize()], blockhash);

    console.log("transaction signature:", sig2);

    debugger;

    const lookupTableAccount = (
        await connection.getAddressLookupTable(lookupTableAddress)
    ).value;

    debugger;
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
