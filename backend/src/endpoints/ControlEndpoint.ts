import { BadRequest } from '../errors';
import { AC } from '../controller/AnvilController';
import { NextFunction, Request, Response, Router, json } from 'express';
import { AnvilCommands } from '../controller/AnvilController';
import { AnvilJobStatus } from '../controller/AnvilJob';
import DB from '../database';


export namespace ControllerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router
            router.get("/control/worker", this.getWorkerList);
            router.get("/control/worker/:id", this.getWorker);
            router.post("/control/worker/:id/shutdown", this.shutdownWorker);
            router.route("/control/job")
                .post(this.addJob)
                .get(this.getJobList);
            router.get("/control/job/:id", this.getJob);
            router.post("/control/job/:id/cancel", this.cancelJob);

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
            let additionalConfig = req.body.additionalConfig;
            let workerId = req.body.workerId;
            let worker;
            if (workerId) {
                worker  = AC.getWorker(workerId);
                if (!worker) {
                    return next(new BadRequest("workerId not found"));
                }
            }
            let job = AC.addJob(config, additionalConfig, worker)
            res.send(job.apiObject());
        }

        private async getJob(req: Request, res: Response, next: NextFunction) {
            let id = req.params.id;
            res.json(AC.getJob(id).apiObject());
        }

        private async getJobList(req: Request, res: Response, next: NextFunction) {
            res.json(AC.getAllJobs().map(j => j.apiObject()));
        }

        private async shutdownWorker(req: Request, res: Response, next: NextFunction) {
            let workerId = req.params.id;
            let worker  = AC.getWorker(workerId);
            if (!worker) {
                return next(new BadRequest("workerId not found"));
            }
            worker.queueAction({command: AnvilCommands.SHUTDOWN});
            res.json({success: true});
        }

        private async cancelJob(req: Request, res: Response, next: NextFunction) {
            let jobId = req.params.id;
            let job = AC.getJob(jobId);
            if (!job) {
                return next(new BadRequest("jobId not found"));
            }
            if (job.worker) {
                job.worker.queueAction({command: AnvilCommands.STOP_RUN, jobId: jobId});
                job.worker.jobs.splice(job.worker.jobs.indexOf(job), 1);
            }
            if (job.report) {
                job.report.Running = false;
                job.report.save();
            }
            job.status = AnvilJobStatus.CANCELD;
            setTimeout(() => AC.removeJob(jobId), 20000);
            res.json({sucess: true});
        }
    }
}

