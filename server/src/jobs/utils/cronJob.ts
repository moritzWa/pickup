export type CronSchedule = {
    repeat: {
        cron: string;
    };
};

export interface ICronJob {
    isDevEnabled(): boolean;
    getCronName(): string;
    getCronSchedule(): CronSchedule;
    run(): void;
}
