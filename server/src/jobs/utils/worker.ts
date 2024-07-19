import { Job } from "bullmq";

export interface IWorker<T> {
    getName(): string;
    process: (job: Job<T>, token?: string) => Promise<void | any>;
}
