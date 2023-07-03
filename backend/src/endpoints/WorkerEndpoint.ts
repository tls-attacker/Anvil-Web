import { AC } from '../controller';
import { NextFunction, Request, Response, Router } from 'express';


export namespace WorkerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router
            router.post("/worker/register", this.registerWorker)
            router.post("/worker/register/alive", this.keepWorkerAlive)
            router.get("/worker/jobs", this.getJobs)
            router.post("/worker/jobs/update", this.updateJob)

        }

        private async registerWorker(req: Request, res: Response, next: NextFunction) {
            let name = req.body.name;
            let worker = AC.addWorker(name);
            res.json(worker.apiObject());
        }

        private async getJobs(req: Request, res: Response, next: NextFunction) {

        }

        private async keepWorkerAlive(req: Request, res: Response, next: NextFunction) {
            let id = req.body.id;
            AC.getWorker(id).keepAlive();
        }

        private async updateJob(req: Request, res: Response, next: NextFunction) {

        }
    }
}

