// import "src/utils/datadogTracer";
import * as _cluster from "cluster";
const cluster = _cluster as unknown as _cluster.Cluster;
import { start } from "./core/start";
import { config, isDevelopment, isProduction } from "./config";

// if prod -> use all CPUs. otherwise just use 2 so is doing local dev it restarts quickly
const isClusterMode = config.cluster;
const numCpus = config.clusterWorkers;
const isInngest = config.exposeInngest;

// for inngest, just use one. this is bc we use pm2 to do the clustering
const numberOfCpus = isClusterMode ? numCpus : 1;

console.log("starting ", numberOfCpus, " web workers");

const _startClusters = () => {
    if (cluster.isPrimary || cluster.isMaster) {
        // console.log(`[running server on ${numberOfCpus}]`);

        // Fork workers.
        for (let i = 0; i < numberOfCpus; i++) {
            cluster.fork();
        }

        cluster.on("exit", (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died ${code} ${signal}`);
            console.log("Let's fork another worker!");
            cluster.fork();
        });
    } else {
        void start();
    }
};

if (numberOfCpus > 1) {
    void _startClusters();
} else {
    void start();
}

process.on("SIGINT", () => {
    // Close your connections and processes
    process.exit();
});
