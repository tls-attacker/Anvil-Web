import { AC } from '../controller';
import { NextFunction, Request, Response, Router } from 'express';


export namespace ControllerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router
            router.get("/control/worker", this.getWorkerList);
            router.get("/control/worker/:id", this.getWorker);
            router.post("/control/job", this.addJob);
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
            res.send("not implemented");
        }

        private async getJob(req: Request, res: Response, next: NextFunction) {
            res.send("not implemented");
        }
    }
}

