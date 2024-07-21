module.exports = {
    apps: [
        {
            name: "pickup-server",
            script: "./build/main.js",
            instances: process.env.NUMBER_OF_WEB_WORKERS || "8",
            exec_mode: "cluster",
            node_args: [
                "-r",
                "./prod-paths.js",
                "--max-old-space-size=16384",
                "--optimize_for_size",
                "--trace-warnings",
            ],
            env: {
                PORT: "8000",
            },
            env_production: {
                TZ: "UTC",
            },
        },
    ],
};
