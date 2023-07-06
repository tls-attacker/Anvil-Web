import { BadRequest } from '../errors';
import { AC } from '../controller/AnvilController';
import { NextFunction, Request, Response, Router } from 'express';


export namespace ControllerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router
            router.get("/control/worker", this.getWorkerList);
            router.get("/control/worker/:id", this.getWorker);
            router.route("/control/job")
                .post(this.addJob)
                .get(this.getJobList);
            router.get("/control/job/:id", this.getJob);

        }

        private async getWorkerList(req: Request, res: Response, next: NextFunction) {
            res.json(AC.getAllWorker().map(w => w.apiObject()));
        }

        private async getWorker(req: Request, res: Response, next: NextFunction) {
            let id = req.params.id;
            res.json(AC.getWorker(id).apiObject());
        }

        private async addJob(req: Request, res: Response, next: NextFunction) {
            let config = req.body.config;
            let workerId = req.body.workerId;
            let worker;
            if (workerId) {
                worker  = AC.getWorker(workerId);
                if (!worker) {
                    next(new BadRequest("workerId not found"));
                }
            }
            let job = AC.addJob(config, worker)
            res.send(job.apiObject());
        }

        private async getJob(req: Request, res: Response, next: NextFunction) {
            let id = req.params.id;
            res.json(AC.getJob(id).apiObject());
        }

        private async getJobList(req: Request, res: Response, next: NextFunction) {
            res.json(AC.getAllJobs().map(j => j.apiObject()));
        }
    }
}

