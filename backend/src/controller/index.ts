import { IAnvilWorker } from "../lib/data_types";

const WORKER_TIMEOUT = 30;

export class AnvilJob {

}

export class AnvilWorker {
    public readonly id: string;
    public readonly name: string;
    private timer: NodeJS.Timeout;

    public jobs: AnvilJob[];

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.keepAlive();
    }

    public keepAlive() {
        if (this.timer != undefined) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.kill(), 1000 * WORKER_TIMEOUT);
    }

    public kill() {
        AC.removeWorker(this);
    }

    public apiObject(): IAnvilWorker {
        return {
            id: this.id,
            name: this.name
        }
    }
}

class AnvilController {
    private workerList: {[id: string]: AnvilWorker};

    constructor() {
        this.workerList = {};
    }

    addWorker(name: string): AnvilWorker {
        let id;
        do {
            id = this.makeId();
        } while (this.workerList[id] != undefined);
        this.workerList[id] = new AnvilWorker(id, name);
        console.debug(`Worker[${this.workerList[id].name} | ${this.workerList[id].id}] connected.`)
        return this.workerList[id];
    }
    
    removeWorker(worker: AnvilWorker) {
        console.debug(`Worker[${worker.name} | ${worker.id}] did not respond for ${WORKER_TIMEOUT}s. Disconnecting.`)
        //delete this.workerList[worker.id];
    }

    getWorker(id: string): AnvilWorker {
        return this.workerList[id];
    }

    getAllWorker(): AnvilWorker[] {
        return Object.values(this.workerList);
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