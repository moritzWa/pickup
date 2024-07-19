// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/creationToolMVP.ts

import { connect } from "src/core/infra/postgres";
import { fetchNewJupiterTokens } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService/fetchNewJupiterTokens";
import { magic } from "src/utils/magic";
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    Connection,
    clusterApiUrl,
    Keypair,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createMint,
    mintTo,
    getOrCreateAssociatedTokenAccount,
    getAssociatedTokenAddress,
    createAssociatedTokenAccount,
    setAuthority,
    createAccount,
    AuthorityType,
} from "@solana/spl-token";
import { sleep } from "radash";
// import { Raydium } from "@raydium/serum";

const IS_PROD = false;

// Raydium addresses: https://docs.raydium.io/raydium/protocol/developers/addresses
const RAYDIUM_DEV_ADDRESS = "CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW";
const RAYDIUM_PROD_ADDRESS = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
const RAYDIUM_ADDRESS = IS_PROD ? RAYDIUM_PROD_ADDRESS : RAYDIUM_DEV_ADDRESS;

const PUBLIC_KEY = "25UyYfnRF4S7eEoTuwDUHf8F1VKS4b8ehGxRoSngLWgA";

const SECRET_KEY =
    "117,74,137,55,74,164,238,77,122,219,236,121,2,182,217,136,210,123,86,9,95,130,13,223,97,88,227,198,83,193,42,150,16,1,164,58,138,29,98,193,33,243,213,235,9,18,227,29,44,97,38,15,49,140,203,43,212,46,176,202,102,113,26,187";

const secretKey = Uint8Array.from(SECRET_KEY.split(",").map(Number));

const newKeypair = new Keypair({
    publicKey: new PublicKey(PUBLIC_KEY).toBytes(),
    secretKey,
});

export const run = async () => {
    // create connection to devnet
    const connection = new Connection(clusterApiUrl("devnet"));

    // const raydium = await Raydium.load({
    //     connection,
    //     owner, // key pair or publicKey, if you run a node process, provide keyPair
    //     signAllTransactions, // optional - provide sign functions provided by @solana/wallet-adapter-react
    //     tokenAccounts, // optional, if dapp handle it by self can provide to sdk
    //     tokenAccountRowInfos, // optional, if dapp handle it by self can provide to sdk
    //     disableLoadToken: false, // default is false, if you don't need token info, set to true
    // });

    // create token

    // generate keypair
    const myKeypair = newKeypair;
    console.log("Solana wallet address: " + myKeypair.publicKey.toBase58());

    // get amount of SOL in wallet
    const balance = await connection.getBalance(myKeypair.publicKey);
    if (balance < 100_000) {
        console.log("Balance is low or zero. Requesting airdrop...");
        // airdrop 1000000000 Lamports (1 SOL)
        await connection.requestAirdrop(myKeypair.publicKey, 1000000000);
        await sleep(20_000); // set timeout to account for airdrop finalization
    }

    // create mint
    const mint = await createMint(
        connection,
        myKeypair,
        myKeypair.publicKey,
        null,
        9
    );
    console.log("mint public address: " + mint.toBase58());

    // get token associated address
    const associatedTokenAddress = await getAssociatedTokenAddress(
        mint,
        myKeypair.publicKey
    );
    console.log("associatedTokenAccount: ", associatedTokenAddress);

    // create associated token account
    const associatedTokenAccount = await createAssociatedTokenAccount(
        connection,
        myKeypair,
        mint,
        myKeypair.publicKey
    );

    // mint 1-100 new tokens to the token address we just created
    await mintTo(
        connection,
        myKeypair,
        mint,
        associatedTokenAddress,
        myKeypair,
        1000000
    );

    // check balance
    const balanceAfter = await connection.getTokenAccountBalance(
        associatedTokenAddress
    );
    console.log("BALANCE OF THE TOKEN AFTER: ", balanceAfter);

    // revoke mint authority
    const revokeMintResp = await setAuthority(
        connection,
        myKeypair,
        mint,
        myKeypair.publicKey,
        AuthorityType.MintTokens,
        null,
        []
    );

    // revoke freeze authority
    const revokeFreezeResp = await setAuthority(
        connection,
        myKeypair,
        mint,
        myKeypair.publicKey,
        AuthorityType.FreezeAccount,
        null,
        []
    );

    // revoke owner authority
    const revokeOwnerResp = await setAuthority(
        connection,
        myKeypair,
        mint,
        myKeypair.publicKey,
        AuthorityType.AccountOwner,
        null,
        []
    );

    // revoke close authority
    const revokeCloseResp = await setAuthority(
        connection,
        myKeypair,
        mint,
        myKeypair.publicKey,
        AuthorityType.CloseAccount,
        null,
        []
    );

    // create new liquidity pool on Raydium

    console.log("done");
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING COMMAND =====");
        console.error(err);
        process.exit(1);
    });
