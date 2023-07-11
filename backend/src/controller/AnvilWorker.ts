import { IAnvilWorker } from "../lib/data_types";
import { AC, AnvilCommand, AnvilCommands } from "./AnvilController";
import { AnvilJob, AnvilJobStatus } from "./AnvilJob";

const WORKER_TIMEOUT = 30;

export enum AnvilWorkerStatus {
    IDLE = "IDLE",
    WORKING = "WORKING",
    PAUSED = "PAUSED"
}

export class AnvilWorker {
    public readonly id: string;
    public readonly name: string;
    public status: AnvilWorkerStatus;
    private timer: NodeJS.Timeout;
    private commands: AnvilCommand[];

    public jobs: AnvilJob[];

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.status = AnvilWorkerStatus.IDLE;
        this.commands = [];
        this.jobs = [];
        this.keepAlive();
    }

    public keepAlive() {
        if (this.timer != undefined) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.kill(), 1000 * WORKER_TIMEOUT);
    }

    public kill() {
        console.debug(`Worker[${this.name} | ${this.id}] did not respond for ${WORKER_TIMEOUT}s. Disconnecting.`)
        AC.removeWorker(this);
    }

    public queueAction(command: AnvilCommand) {
        this.commands.push(command);
    }

    public apiObject(): IAnvilWorker {
        return {
            id: this.id,
            name: this.name,
            status: this.status.toString(),
            jobs: this.jobs.map(j => j.apiObject())
        }
    }

    public fetchCommand(status: AnvilWorkerStatus): AnvilCommand {
        this.status = status;

        // if something is queued up, send it out and delete it
        if (this.commands.length>0) {
            return this.commands.shift();
        } else {
            // else if worker idles, see if we can find a new job
            if (status == AnvilWorkerStatus.IDLE) {
                let job = AC.getNextQueuedJob();
                if (job) {
                    job.worker = this;
                    job.status = AnvilJobStatus.RUNNING;
                    job.progress = 1;
                    this.jobs.push(job);
                    return {
                        command: AnvilCommands.QUEUE_RUN,
                        job: job.apiObject()
                    }
                }
            }
            // or just leave it be
            return {
                command: AnvilCommands.OK
            }
        }
    }
}