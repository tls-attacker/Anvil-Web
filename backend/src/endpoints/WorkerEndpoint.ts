import { BadRequest } from '../errors';
import { AC } from '../controller/AnvilController';
import { NextFunction, Request, Response, Router } from 'express';
import DB from '../database';
import { ITestCase, ITestRun, ITestRunEdit, TestResult } from '../lib/data_types';
import { AnvilJobStatus } from '../controller/AnvilJob';


export namespace WorkerEndpoint {

    export class Controller {
        private router: Router

        constructor(router: Router) {
            this.router = router;
            router.post("/worker/register", this.registerWorker);
            router.post("/worker/fetch", this.fetch);
            router.post("/worker/update/scan", this.updateScan);
            router.post("/worker/update/report", this.updateReport);
            router.post("/worker/update/testrun", this.updateTestRun);
            router.post("/worker/update/testcase", this.updateTestCase);

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

        private async updateReport(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }

            let newReport = req.body.summary;
            if (!job.report) {
                job.report = await DB.Report.create(newReport);
            } else {
                job.report.overwrite(newReport);
                clearTimeout(job.reportTimeout);
                job.reportTimeout = setTimeout(() => job.report.save(), 3000);
            }

            if (req.body.finished) {
                AC.removeJob(jobId);
            }
            
            res.json({status: "OK"});
        }

        private async updateTestRun(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            if (!job.report) {
                return next(new BadRequest("no associated report posted before"));
            }
            let newTestRun = req.body.testRun as ITestRun;
            let className = newTestRun.TestMethod.ClassName;
            let methodName = newTestRun.TestMethod.MethodName;
            let testRun = job.testRuns[className+":"+methodName];
            if (!testRun) {
                job.testRuns[className+":"+methodName] = new DB.TestRun(newTestRun);
                testRun = job.testRuns[className+":"+methodName];
            } else {
                testRun.overwrite(newTestRun);
            }
            testRun.ContainerId = job.report._id;
            
            if (req.body.finished) {
                job.report.FinishedTests++;
                job.progress = Math.round(100*(job.report.FinishedTests)/job.report.TotalTests);

                if (testRun.TestCases.length == 0) { // test has no cases, count testrun
                    switch (testRun.Result) {
                        case TestResult.STRICTLY_SUCCEEDED:
                        case TestResult.CONCEPTUALLY_SUCCEEDED:
                            job.report.SucceededTests++;
                            break;
                        case TestResult.FULLY_FAILED:
                        case TestResult.PARTIALLY_FAILED:
                            job.report.FailedTests++;
                            break;
                        case TestResult.DISABLED:
                        case TestResult.PARSER_ERROR:
                        case TestResult.NOT_SPECIFIED:
                        default:
                            job.report.DisabledTests++;
                    }
                }

                clearTimeout(job.reportTimeout);
                job.reportTimeout = setTimeout(() => job.report.save(), 3000);
            }
            clearTimeout(job.testRunTimeouts[className+":"+methodName])
            job.testRunTimeouts[className+":"+methodName] = setTimeout(() => testRun.save(), 3000);
            
            res.json({status: "OK"});
        }

        private async updateTestCase(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            if (!job.report) {
                return next(new BadRequest("no associated report posted before"));
            }
            let newTestCase = req.body.state as ITestCase;
            let className = req.body.className;
            let methodName = req.body.methodName;
            let testRun = job.testRuns[className+":"+methodName];
            if (!testRun) {
                return next(new BadRequest("no associated testrun posted before"));
            }
            testRun.TestCases.push(newTestCase);
            testRun.CaseCount++;
            clearTimeout(job.testRunTimeouts[className+":"+methodName])
            job.testRunTimeouts[className+":"+methodName] = setTimeout(() => testRun.save(), 3000);

            job.report.StatesCount++;
            switch (newTestCase.Result) {
                case TestResult.STRICTLY_SUCCEEDED:
                case TestResult.CONCEPTUALLY_SUCCEEDED:
                    job.report.SucceededTests++;
                    break;
                case TestResult.FULLY_FAILED:
                case TestResult.PARTIALLY_FAILED:
                    job.report.FailedTests++;
                    break;
                case TestResult.DISABLED:
                case TestResult.PARSER_ERROR:
                case TestResult.NOT_SPECIFIED:
                default:
                    job.report.DisabledTests++;
            }
            clearTimeout(job.reportTimeout);
            job.reportTimeout = setTimeout(() => job.report.save(), 3000);

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

