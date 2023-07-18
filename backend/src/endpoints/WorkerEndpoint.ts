import { BadRequest } from '../errors';
import { AC } from '../controller/AnvilController';
import { NextFunction, Request, Response, Router } from 'express';
import DB from '../database';
import { IState, ITestResult, TestOutcome } from '../lib/data_types';
import { AnvilJobStatus } from '../controller/AnvilJob';


export namespace WorkerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router;
            router.post("/worker/register", this.registerWorker);
            router.post("/worker/fetch", this.fetch);
            router.post("/worker/update/scan", this.updateScan);
            router.post("/worker/update/testrun", this.updateTestRun);
            router.post("/worker/update/testresult", this.updateTestResult);
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

        private async updateTestRun(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }

            let newTestRun = req.body.summary;
            if (!job.testRun) {
                job.testRun = await DB.TestRun.create(newTestRun);
            } else {
                job.testRun.overwrite(newTestRun);
                clearTimeout(job.testrunTimeout);
                job.testrunTimeout = setTimeout(() => job.testRun.save(), 3000);
            }

            if (req.body.finished) {
                AC.removeJob(jobId);
            }
            
            res.json({status: "OK"});
        }

        private async updateTestResult(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            if (!job.testRun) {
                return next(new BadRequest("no associated testrun posted before"));
            }
            let newTestResult = req.body.testResult as ITestResult;
            let className = newTestResult.TestMethod.ClassName;
            let methodName = newTestResult.TestMethod.MethodName;
            let testResult = job.testResults[className+":"+methodName];
            if (!testResult) {
                job.testResults[className+":"+methodName] = new DB.TestResult(newTestResult);
                testResult = job.testResults[className+":"+methodName];
            } else {
                testResult.overwrite(newTestResult);
            }
            testResult.ContainerId = job.testRun._id;
            
            if (req.body.finished) {
                job.testRun.FinishedTests++;
                job.progress = Math.round(100*(job.testRun.FinishedTests)/job.testRun.TotalTests);

                if (testResult.States.length == 0) { // test has no states, count result
                    switch (testResult.Result) {
                        case TestOutcome.STRICTLY_SUCCEEDED:
                        case TestOutcome.CONCEPTUALLY_SUCCEEDED:
                            job.testRun.SucceededTests++;
                            break;
                        case TestOutcome.FULLY_FAILED:
                        case TestOutcome.PARTIALLY_FAILED:
                            job.testRun.FailedTests++;
                            break;
                        case TestOutcome.DISABLED:
                        case TestOutcome.PARSER_ERROR:
                        case TestOutcome.NOT_SPECIFIED:
                        default:
                            job.testRun.DisabledTests++;
                    }
                }

                clearTimeout(job.testrunTimeout);
                job.testrunTimeout = setTimeout(() => job.testRun.save(), 3000);
            }
            clearTimeout(job.testResultTimeouts[className+":"+methodName])
            job.testResultTimeouts[className+":"+methodName] = setTimeout(() => testResult.save(), 3000);
            
            res.json({status: "OK"});
        }

        private async updateState(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            if (!job.testRun) {
                return next(new BadRequest("no associated testrun posted before"));
            }
            let newTestState = req.body.state as IState;
            let className = req.body.className;
            let methodName = req.body.methodName;
            let testResult = job.testResults[className+":"+methodName];
            if (!testResult) {
                return next(new BadRequest("no associated testresult posted before"));
            }
            testResult.States.push(newTestState);
            testResult.StatesCount++;
            clearTimeout(job.testResultTimeouts[className+":"+methodName])
            job.testResultTimeouts[className+":"+methodName] = setTimeout(() => testResult.save(), 3000);

            job.testRun.StatesCount++;
            switch (newTestState.Result) {
                case TestOutcome.STRICTLY_SUCCEEDED:
                case TestOutcome.CONCEPTUALLY_SUCCEEDED:
                    job.testRun.SucceededTests++;
                    break;
                case TestOutcome.FULLY_FAILED:
                case TestOutcome.PARTIALLY_FAILED:
                    job.testRun.FailedTests++;
                    break;
                case TestOutcome.DISABLED:
                case TestOutcome.PARSER_ERROR:
                case TestOutcome.NOT_SPECIFIED:
                default:
                    job.testRun.DisabledTests++;
            }
            clearTimeout(job.testrunTimeout);
            job.testrunTimeout = setTimeout(() => job.testRun.save(), 3000);

            res.json({status: "OK"});
        }

        private async updateScan(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            job.status = AnvilJobStatus.TESTING;
            res.json({status: "OK"});
        }
    }
}

