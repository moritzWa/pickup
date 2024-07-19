import { FlowJob } from "bullmq";

export const printFlowDAG = (flowJob: FlowJob, msg?: string) => {
    const jobs = dfsFlowJobs(flowJob);
    const jobFlowString = jobs.map((j) => j.name).join(" > ");

    console.log("=========================");
    console.log("");
    console.log("");
    console.log(`JOB DAG${msg ? " (" + msg + ")" : ""}: ${jobFlowString}`);
    console.log("");
    console.log("");
    console.log("=========================");
};

// depth first search on flow jobs to get jobs in order for the DAG
export const dfsFlowJobs = (node: FlowJob) => {
    // Create a Stack and add our initial node in it
    const stack: FlowJob[] = [];
    const dfs: FlowJob[] = [];
    const visited = new Set<string>();

    stack.push(node);
    dfs.push(node);

    // Mark the first node as visited
    visited.add(node.opts?.jobId || "");

    // go through the stack while there are elements and visit the child + push onto the stack
    while (stack.length > 0) {
        const tempNode = stack.pop();

        if (tempNode?.children) {
            tempNode.children.forEach((child) => {
                if (!visited.has(child.opts?.jobId || "")) {
                    dfs.push(child);
                    stack.push(child);
                    visited.add(child.opts?.jobId || "");
                }
            });
        }
    }

    // the reverse of this is what we want (the leaf nodes are actually the first to be processed, it is like reverse DFS basically)
    return dfs.reverse();
};
