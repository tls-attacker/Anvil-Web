import { IAnvilJob, ITestRun } from "../lib/data_types";
import { AnvilWorker } from "./AnvilWorker";

export enum AnvilJobStatus {
    RUNNING,
    PAUSED,
    QUEUED
}

export class AnvilJob {
    public readonly id: string;
    public status: AnvilJobStatus;
    public progress: number;
    public testRun: ITestRun;
    public config: any;
    public worker: AnvilWorker;

    constructor(id: string, config: any, worker?: AnvilWorker) {
        this.id = id;
        this.config = config;
        this.worker = worker;
        this.status = AnvilJobStatus.QUEUED;
        this.progress = 0;
    }

    public apiObject(): IAnvilJob {
        return {
            id: this.id,
            status: this.status.toString(),
            progress: this.progress,
            //identifier: this.testRun.Identifier,
            config: this.config,
            workerId: this.worker ? this.worker.id : null,
            workerName: this.worker ? this.worker.name : null
        }
    }
}