require("dotenv").config();

import * as os from "os";

const NUM_CPUs = os.cpus().length;
const parsePrivateKey = (key?: string) => (key || "").replace(/\\n/g, "\n");

// march 1st UTC 2024
export const VALID_FREE_SUBSCRIPTION = new Date("2024-03-01T00:00:00.000Z");

export const config = {
    domain: "https://movement.market/",
    port: process.env.PORT || "5000",
    env: process.env.NODE_ENV || "local",
    workers: process.env.WORKERS || 2,
    freeUntilDate: VALID_FREE_SUBSCRIPTION,
    exposeInngest: process.env.EXPOSE_INNGEST === "true",
    enableWorkersForStandaloneServer: process.env.ENABLE_WORKERS === "true",
    jwtSecret: process.env.JWT_SECRET || "blah-blah-blah",
    cluster: process.env.CLUSTER_MODE === "true",
    clusterWorkers: process.env.CLUSTER_WORKERS
        ? parseInt(process.env.CLUSTER_WORKERS)
        : NUM_CPUs,
    urls: {
        frontend: process.env.FRONTEND_URL || "",
    },
    algolia: {
        apiKey: process.env.ALGOLIA_API_KEY || "",
        appId: process.env.ALGOLIA_APP_ID || "",
        tokenIndex: process.env.ALGOLIA_TOKEN_INDEX || "dev_tokens",
    },
    firebase: {
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    },
    aws: {
        accessKey: process.env.AWS_ACCESS_KEY || "",
        secretKey: process.env.AWS_SECRET_KEY || "",
        region: process.env.AWS_REGION || "us-east-1",
    },
    google: {
        projectId: process.env.GOOGLE_PROJECT_ID || "",
        privateKey: parsePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL || "",
    },
    postgres: {
        uri: process.env.POSTGRES_URI || "",
        ssl: process.env.POSTGRES_SSL === "true",
        sslCaCert: process.env.POSTGRES_SSL_CA_CERT || "",
    },
    coinbase: {
        clientId: process.env.COINBASE_CLIENT_ID || "",
        secretKey: process.env.COINBASE_SECRET_KEY || "",
        redirectUrl:
            process.env.COINBASE_REDIRECT_URL ||
            "http://localhost:3000/auth/coinbase/redirect",
    },
    redis: {
        persistedRedisUrl: process.env.PERSISTED_REDIS_URL || "",
        cacheRedisUrl:
            process.env.CACHE_REDIS_URL ||
            process.env.PERSISTED_REDIS_URL ||
            "",
    },
    datadog: {
        enabled: process.env.INITIALIZE_DATADOG === "true",
        env: process.env.DATADOG_ENV || "",
        statsd: {
            host: process.env.DATADOG_STATSD_HOST || "",
            port: parseInt(process.env.DATADOG_STATSD_PORT || "5000"),
        },
    },
    sentry: {
        dsn: process.env.SENTRY_DSN || "",
    },
    slack: {
        token: process.env.SLACK_BOT_TOKEN || "",
    },
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || "https://ssc-dao.genesysgo.net",
    },
    mnemonic: {
        apiKey: process.env.MNEMONIC_API_KEY || "",
        baseUrl:
            process.env.MNEMONIC_BASE_URL ||
            "https://canary-ethereum.rest.mnemonichq.com",
    },
    simplehash: {
        apiKey: process.env.SIMPLEHASH_API_KEY || "",
    },
    loops: {
        apiKey: process.env.LOOPS_API_KEY || "",
    },
    coingecko: {
        apiKey: process.env.COINGECKO_API_KEY || "",
    },
    birdeye: {
        apiKey: process.env.BIRDEYE_API_KEY || "",
    },
    cryptonewsapi: {
        apiKey: process.env.CRYPTONEWSAPI_API_KEY || "",
    },
    hatchfi: {
        clientId: process.env.HATCHFI_CLIENT_ID || "",
        secretKey: process.env.HATCHFI_SECRET_KEY || "",
        apiKey: process.env.HATCHFI_API_KEY || "",
    },
    cryptoapis: {
        apiKey:
            process.env.CRYPTOAPIS_API_KEY ||
            "b0f1a37bf2486c9bfd7e41f89fe56f7e75a1de35",
    },
    // etherscan family of companies
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
    bscscan: {
        apiKey: process.env.BSCSCAN_API_KEY || "",
    },
    polygonscan: {
        apiKey: process.env.POLYGONSCAN_API_KEY || "",
    },
    arbiscan: {
        apiKey: process.env.ARBISCAN_API_KEY || "",
    },
    snowtrace: {
        routescanApiKey: process.env.ROUTESCAN_API_KEY || "",
        apiKey: process.env.SNOWTRACE_API_KEY || "",
    },
    pulsechainscan: {
        apiKey: process.env.PULSECHAINSCAN_API_KEY || "",
    },
    ftmscan: {
        apiKey: process.env.FTMSCAN_API_KEY || "",
    },
    gnosisscan: {
        apiKey: process.env.GNOSISSCAN_API_KEY || "",
    },
    // etherscan
    optimistic: {
        apiKey: process.env.OPTIMISMISTIC_API_KEY || "",
    },
    basescan: {
        apiKey: process.env.BASESCAN_API_KEY || "",
    },
    appStoreUrl: process.env.APP_STORE_URL,
    twilio: {
        fromNumber: process.env.TWILIO_FROM_NUMBER || "",
        accountSid: process.env.TWILIO_ACCOUNT_SID || "",
        authToken: process.env.TWILIO_AUTH_TOKEN || "",
        verifyServiceAccount: process.env.TWILIO_VERIFY_SERVICE_ACCOUNT || "",
        messagingServiceAccount:
            process.env.TWILIO_MESSAGING_SERVICE_ACCOUNT || "",
    },
    sendgrid: {
        fromEmail: process.env.SENDGRID_FROM_EMAIL || "team@awaken.tax",
        fromName: process.env.SENDGRID_FROM_NAME || "Movement",
        secret: process.env.SENDGRID_API_KEY || "",
    },
    segment: {
        writeApiKey: process.env.SEGMENT_WRITE_API_KEY || "",
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || "",
        secret: process.env.PAYPAL_SECRET || "",
        webhookId: process.env.PAYPAL_WEBHOOK_ID || "",
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    },
    magic: {
        secretKey: process.env.MAGIC_SECRET_KEY || "",
    },
    atlasServiceUrl: process.env.ATLAS_SERVICE_URL || "",
    jup: {
        apiUrl: process.env.JUP_API_URL || "https://quote-api.jup.ag/v6",
    },
    mobile: {
        latestVersion: process.env.LATEST_MOBILE_VERSION || "1.1.5",
    },
    cloudflare: {
        imageApiKey: process.env.CLOUDFLARE_IMAGE_API_KEY || "",
    },
    alchemy: {
        ethApiKey: process.env.ALCHEMY_API_KEY || "",
        maticApiKey: process.env.ALCHEMY_MATIC_API_KEY || "",
        arbitrumApiKey: process.env.ALCHEMY_ARBITRUM_API_KEY || "",
        optimismApiKey: process.env.ALCHEMY_OPTIMISM_API_KEY || "",
        solanaApiKey: process.env.ALCHEMY_SOLANA_API_KEY || "",
        baseApiKey: process.env.ALCHEMY_BASE_API_KEY || "",
    },
    moralis: {
        apiKey: process.env.MORALIS_API_KEY || "",
    },
    tatum: {
        apiKey: process.env.TATUM_API_KEY || "",
    },
    helius: {
        apiKey: process.env.HELIUS_API_KEY || "",
    },
    covalent: {
        apiKey: process.env.COVALENTHQ_API_KEY || "",
    },
    plaid: {
        secretKey: process.env.PLAID_SECRET_KEY || "",
        environment: process.env.PLAID_ENV || "",
        clientId: process.env.PLAID_CLIENT_ID || "",
    },
    pusher: {
        appId: process.env.PUSHER_APP_ID || "1753415",
        key: process.env.PUSHER_APP_KEY || "5b8dcf6b3dd93bfb314e",
        secret: process.env.PUSHER_SECRET || "2f1b0be7a6664b752150",
        cluster: process.env.PUSHER_CLUSTER || "us3",
    },
    apilayer: {
        apiKey: process.env.API_LAYER_API_KEY || "",
    },
    logtree: {
        publicKey: process.env.LOGTREE_PUBLIC_KEY || "",
        secretKey: process.env.LOGTREE_SECRET_KEY || "",
    },
    defined: {
        apiKey: process.env.DEFINED_API_KEY || "",
    },
    inngest: {
        signingKey: process.env.INNGEST_SIGNING_KEY || "empty",
        eventKey: process.env.INNGEST_EVENT_KEY || "empty",
        baseUrl: process.env.INNGEST_BASE_URL || "http://localhost:8288",
        baseInngestUrl:
            process.env.INNGEST_BASE_API_URL || "http://localhost:8288",
        numberOfLargeWorkers: process.env.NUMBER_OF_LARGE_WORKERS || "2",
        largeClientTxnCount: process.env.LARGE_CLIENT_TXN_COUNT || "10000",
    },
    ankr: {
        apiKey: process.env.ANKR_API_KEY || "",
    },
    intercom: {
        secretKey: process.env.INTERCOM_SECRET_KEY || "",
        iosSecretKey: process.env.INTERCOM_IOS_SECRET_KEY || "",
        androidSecretKey: process.env.INTERCOM_ANDROID_SECRET_KEY || "",
    },
    debank: {
        accessKey: process.env.DEBANK_ACCESS_KEY || "",
    },
    sonarwatch: {
        accessKey: process.env.SONAR_WATCH_ACCESS_KEY || "",
    },
    openai: {
        projectId: process.env.OPENAI_PROJECT_ID || "",
        apiKey: process.env.OPENAI_API_KEY || "",
    },
    typeorm: {
        explainSlowQueries:
            (process.env.TYPEORM_EXPLAIN_SLOW_QUERIES || "true") === "true",
    },
    onesignal: {
        appId: process.env.ONESIGNAL_APP_ID || "",
        apiKey: process.env.ONESIGNAL_REST_API_KEY || "",
    },
    concurrency: {
        maxConcurrency: process.env.AWAKEN_MAX_CONCURRENCY || "2",
        maxWaitTime: process.env.AWAKEN_MAX_WAIT_TIME || "5000",
    },
    awakenFeePayer: {
        privateKey:
            process.env.MOVEMENT_FEE_PAYER_PRIVATE_KEY ||
            process.env.AWAKEN_FEE_PAYER_PRIVATE_KEY ||
            "",
    },
    movement: {
        onrampPrivateKey: process.env.MOVEMENT_ONRAMP_PRIVATE_KEY || "",
        fundAccountPrivateKey:
            process.env.MOVEMENT_FUND_ACCOUNT_PRIVATE_KEY || "",
        airdropPrivateKey: process.env.MOVEMENT_AIRDROP_PRIVATE_KEY || "",
        jupiterReferralAccountPubKey:
            process.env.MOVEMENT_JUPITER_REFERRAL_ACCOUNT_PUB_KEY ||
            process.env.AWAKEN_JUPITER_REFERRAL_ACCOUNT_PUB_KEY ||
            "CXnD2XHTWbozvD9bT9HG17Wr8EvV2pfECaWszVExyYFm",
        feeAccountPubKey:
            process.env.MOVEMENT_FEE_ACCOUNT_PUB_KEY ||
            process.env.AWAKEN_FEE_ACCOUNT_PUB_KEY ||
            "muLap14LG1yP6qTerDVooZqf4zbwVZaWVK1KMCzheEd",
    },
};

export const isProduction = () => config.env === "production";
export const isDevelopment = () =>
    config.env === "local" || config.env === "development";

// TODO: remove
export const OMAR_ACCOUNTS = ["8dc02d9c-05e1-4b0a-835c-439b57c85e2b"];
