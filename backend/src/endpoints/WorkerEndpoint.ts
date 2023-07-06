import { BadRequest } from '../errors';
import { AC } from '../controller/AnvilController';
import { NextFunction, Request, Response, Router } from 'express';


export namespace WorkerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router;
            router.post("/worker/register", this.registerWorker);
            router.post("/worker/fetch", this.fetch);
            router.post("/worker/update/summary", this.updateSummary);
            router.post("/worker/update/test", this.updateTest);
            router.post("/worker/update/state", this.updateState);

        }

        private async registerWorker(req: Request, res: Response, next: NextFunction) {
            let name = req.body.name;
            let worker = AC.addWorker(name);
            res.json(worker.apiObject());
        }

        private async fetch(req: Request, res: Response, next: NextFunction) {
            let id = req.body.id;
            let status = req.body.status;
            let worker = AC.getWorker(id as string);
            if (!worker) {
                return next(new BadRequest("id not valid"));
            }
            worker.keepAlive();
            res.json(worker.fetchCommand(status));
        }

        private async updateSummary(req: Request, res: Response, next: NextFunction) {
            let jobId = req.query.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            let summary = req.body;
            // update in db
            res.json({status: "OK"});
        }

        private async updateTest(req: Request, res: Response, next: NextFunction) {
            let jobId = req.query.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            let className = req.query.className;
            let methodName = req.query.methodName;
            let test = req.body;
            // update in db
            res.json({status: "OK"});
        }

        private async updateState(req: Request, res: Response, next: NextFunction) {
            let jobId = req.query.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            let className = req.query.className;
            let methodName = req.query.methodName;
            let uuid = req.query.uuid;
            let state = req.body;
            // update in db
            res.json({status: "OK"});
        }
    }
}

