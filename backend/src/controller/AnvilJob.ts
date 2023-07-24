import { IAnvilJob, IReport, ITestRun } from "../lib/data_types";
import { AnvilWorker } from "./AnvilWorker";
import { HydratedDocument } from "mongoose";

export enum AnvilJobStatus {
    SCANNING = "SCANNING",
    TESTING = "TESTING",
    PAUSED = "PAUSED",
    QUEUED = "QUEUED",
    CANCELD = "CANCELD"
}

export class AnvilJob {
    public readonly id: string;
    public status: AnvilJobStatus;
    public progress: number;
    public report: HydratedDocument<IReport>;
    public testRuns: {[classMethod: string]: HydratedDocument<ITestRun>};
    public testRunTimeouts: {[classMethod: string]: NodeJS.Timeout};
    public reportTimeout: NodeJS.Timeout;
    public config: any;
    public worker: AnvilWorker;

    constructor(id: string, config: any, worker?: AnvilWorker) {
        this.id = id;
        this.config = config;
        this.worker = worker;
        this.status = AnvilJobStatus.QUEUED;
        this.progress = 0;
        this.testRuns = {};
        this.testRunTimeouts = {};
    }

    public apiObject(): IAnvilJob {
        return {
            id: this.id,
            status: this.status.toString(),
            progress: this.progress,
            identifier: this.report ? this.report.Identifier : "unset",
            config: this.config,
            workerId: this.worker ? this.worker.id : null,
            workerName: this.worker ? this.worker.name : null
        }
    }
}