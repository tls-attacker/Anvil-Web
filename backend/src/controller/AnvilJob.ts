import { IAnvilJob, IReport, ITestRun } from "../lib/data_types";
import { AnvilWorker } from "./AnvilWorker";
import { HydratedDocument } from "mongoose";
import DB from '../database';

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
    public testRuns: {[testId: string]: HydratedDocument<ITestRun>};
    public testRunTimeouts: {[classMethod: string]: NodeJS.Timeout};
    public reportTimeout: NodeJS.Timeout;
    public config: string;
    public additionalConfig: string
    public worker: AnvilWorker;

    constructor(id: string, config: string, additionalConfig: string, worker?: AnvilWorker) {
        this.id = id;
        this.config = config;
        this.additionalConfig = additionalConfig;
        this.worker = worker;
        this.status = AnvilJobStatus.QUEUED;
        this.progress = 0;
        this.testRuns = {};
        this.testRunTimeouts = {};
        try {
            let anvilConfig = JSON.parse(config);
            this.report = new DB.Report({
                Identifier: anvilConfig.identifier,
                TestEndpointType: anvilConfig.endpointMode,
                Date: new Date(),
                Running: true,
                PartiallyFailedTests: 0,
                FullyFailedTests: 0,
                ConceptuallySucceededTests: 0,
                StrictlySucceededTests: 0,
                DisabledTests: 0,
                FinishedTests: 0,
                TestCaseCount: 0,
                AnvilConfig: anvilConfig.config,
                AdditionalConfig: anvilConfig.additionalConfig});
        } catch (error) {
            console.error("Cannot fully create job. Config cannot be parsed as json: " + config);
        }
        
    }

    public apiObject(): IAnvilJob {
        return {
            id: this.id,
            status: this.status.toString(),
            progress: this.progress,
            identifier: this.report ? this.report.Identifier : "unset",
            config: this.config,
            additionalConfig: this.additionalConfig,
            workerId: this.worker ? this.worker.id : null,
            workerName: this.worker ? this.worker.name : null
        }
    }
}