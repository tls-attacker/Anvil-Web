import { IAnvilJob, ITestResult, ITestRun } from "../lib/data_types";
import { AnvilWorker } from "./AnvilWorker";
import { HydratedDocument } from "mongoose";

export enum AnvilJobStatus {
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    QUEUED = "QUEUED"
}

export class AnvilJob {
    public readonly id: string;
    public status: AnvilJobStatus;
    public progress: number;
    public testRun: HydratedDocument<ITestRun>;
    public testResults: {[classMethod: string]: HydratedDocument<ITestResult>};
    public testResultTimeouts: {[classMethod: string]: NodeJS.Timeout};
    public testrunTimeout: NodeJS.Timeout;
    public config: any;
    public worker: AnvilWorker;

    constructor(id: string, config: any, worker?: AnvilWorker) {
        this.id = id;
        this.config = config;
        this.worker = worker;
        this.status = AnvilJobStatus.QUEUED;
        this.progress = 0;
        this.testResults = {};
        this.testResultTimeouts = {};
    }

    public apiObject(): IAnvilJob {
        return {
            id: this.id,
            status: this.status.toString(),
            progress: this.progress,
            identifier: this.testRun ? this.testRun.Identifier : "unset",
            config: this.config,
            workerId: this.worker ? this.worker.id : null,
            workerName: this.worker ? this.worker.name : null
        }
    }
}