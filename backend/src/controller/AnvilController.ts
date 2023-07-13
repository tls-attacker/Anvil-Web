import { IAnvilJob } from "../lib/data_types";
import { AnvilJobStatus } from "./AnvilJob";
import { AnvilJob } from "./AnvilJob";
import { AnvilWorker } from "./AnvilWorker";

export interface AnvilCommand {
    command: AnvilCommands,
    job?: IAnvilJob,
    jobId?: string,
    className?: string,
    methodName?: string,
    uuid?: string
}

export enum AnvilCommands {
    QUEUE_RUN = "QUEUE_RUN",
    STOP_RUN = "STOP_RUN",
    PAUSE_RUN = "PAUSE_RUN",
    RESTART_RUN = "RESTART_RUN",
    RESTART_TEST = "RESTART_TEST",
    RESTART_STATE = "RESTART_STATE",
    SHUTDOWN = "SHUTDOWN",
    OK = "OK"
}

class AnvilController {
    private workerList: {[id: string]: AnvilWorker};
    private jobList: {[id: string]: AnvilJob};

    constructor() {
        this.workerList = {};
        this.jobList = {};
    }

    addWorker(name: string): AnvilWorker {
        let id;
        do {
            id = this.makeId();
        } while (this.workerList[id] != undefined);
        this.workerList[id] = new AnvilWorker(id, name);
        console.debug(`Worker[${name} | ${id}] connected.`)
        return this.workerList[id];
    }
    
    removeWorker(worker: AnvilWorker) {
        for (let job of worker.jobs) {
            if (job.testRun) {
                job.testRun.Running = false;
                job.testRun.save();
            }
            if (job.status == AnvilJobStatus.QUEUED) {
                job.worker = undefined;
            } else {
                this.removeJob(job.id);
            }
        }
        delete this.workerList[worker.id];
    }

    getWorker(id: string): AnvilWorker {
        return this.workerList[id];
    }

    getAllWorker(): AnvilWorker[] {
        return Object.values(this.workerList);
    }

    addJob(config: any, worker?: AnvilWorker): AnvilJob {
        let id;
        do {
            id = this.makeId();
        } while (this.jobList[id] != undefined);
        this.jobList[id] = new AnvilJob(id, config, worker);
        if (!worker) {
            console.debug(`New job[${id}] added to the pool.`)
        } else {
            worker.queueAction({
                command: AnvilCommands.QUEUE_RUN,
                job: this.jobList[id].apiObject()
            });
        }
        return this.jobList[id];
    }
    
    removeJob(jobId: string) {
        delete this.jobList[jobId];
    }

    getJob(jobId: string): AnvilJob {
        return this.jobList[jobId];
    }

    getAllJobs(): AnvilJob[] {
        return Object.values(this.jobList);
    }

    getNextQueuedJob(): AnvilJob | null {
        for (let job of Object.values(this.jobList)) {
            if (job.status == AnvilJobStatus.QUEUED && job.worker == undefined) {
                return job;
            }
        }
        return null;
    }

    private makeId() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 6) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
}

export const AC = new AnvilController();