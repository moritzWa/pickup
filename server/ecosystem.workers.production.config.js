module.exports = {
    apps: [
        {
            name: "pickup-workers",
            script: "./build/main.js",
            instances: process.env.NUMBER_OF_INNGEST_WORKERS || "6",
            exec_mode: "cluster",
            node_args: [
                "-r",
                "./prod-paths.js",
                "--max-old-space-size=8000",
                "--optimize_for_size",
                "--trace-warnings",
            ],
            max_memory_restart: "8500M",
            env: {
                PORT: "8000",
            },
            env_production: {
                TZ: "UTC",
                EXPOSE_INNGEST: "true",
            },
        },
    ],
};
