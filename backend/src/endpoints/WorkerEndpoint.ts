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
            router.post("/worker/update/status", this.updateStatus);
            router.post("/worker/update/report", this.updateReport);
            router.post("/worker/update/testrun", this.updateTestRun);
            router.post("/worker/update/testcase", this.updateTestCase);
            router.post("/worker/update/pcap", this.updatePcapData);

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

            let newReport = req.body.report;
            if (!job.report) {
                job.report = await DB.Report.create(newReport);
            } else {
                job.report.overwrite(newReport);
                clearTimeout(job.reportTimeout);
                job.reportTimeout = setTimeout(() => job.report.save(), 3000);
            }

            if (req.body.finished) {
                setTimeout(() => AC.removeJob(jobId), 5000);
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
                return next(new BadRequest("no associated report found"));
            }
            let newTestRun = req.body.testRun as ITestRun;
            let testRun = job.testRuns[newTestRun.TestId];
            if (!testRun) {
                job.testRuns[newTestRun.TestId] = new DB.TestRun(newTestRun);
                testRun = job.testRuns[newTestRun.TestId];
            } else {
                testRun.overwrite(newTestRun);
            }
            testRun.ContainerId = job.report._id;
            
            if (req.body.finished) {
                job.report.FinishedTests++;
                job.report.TestCaseCount += testRun.TestCases.length;
                if (job.report.TotalTests>0) {
                    job.progress = Math.round(100*(job.report.FinishedTests)/job.report.TotalTests);
                }

                switch (testRun.Result) {
                    case TestResult.STRICTLY_SUCCEEDED:
                        job.report.StrictlySucceededTests++;
                        break;
                    case TestResult.CONCEPTUALLY_SUCCEEDED:
                        job.report.ConceptuallySucceededTests++;
                        break;
                    case TestResult.FULLY_FAILED:
                        job.report.FullyFailedTests++;
                        break;
                    case TestResult.PARTIALLY_FAILED:
                        job.report.PartiallyFailedTests++;
                        break;
                    case TestResult.DISABLED:
                    case TestResult.PARSER_ERROR:
                    case TestResult.NOT_SPECIFIED:
                    default:
                        job.report.DisabledTests++;
                }
                
                clearTimeout(job.reportTimeout);
                job.reportTimeout = setTimeout(() => job.report.save(), 3000);
            }
            clearTimeout(job.testRunTimeouts[newTestRun.TestId])
            job.testRunTimeouts[newTestRun.TestId] = setTimeout(() => testRun.save(), 3000);
            
            res.json({status: "OK"});
        }

        private async updateTestCase(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            if (!job.report) {
                return next(new BadRequest("no associated report found"));
            }
            let newTestCase = req.body.testCase as ITestCase;
            let testId = req.body.testId;
            let testRun = job.testRuns[testId];
            if (!testRun) {
                testRun = new DB.TestRun({
                    TestId: testId,
                    CaseCount: 0,
                    TestCases: [],
                    Result: "INCOMPLETE",
                    Score: null
                });
                testRun.ContainerId = job.report._id;
                job.testRuns[testId] = testRun;
            }
            testRun.TestCases.push(newTestCase);
            testRun.CaseCount++;
            clearTimeout(job.testRunTimeouts[testId])
            job.testRunTimeouts[testId] = setTimeout(() => testRun.save(), 3000);
            res.json({status: "OK"});
        }

        private async updatePcapData(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            if (!job.report) {
                return next(new BadRequest("no associated report found"));
            }
            let uuid = req.body.uuid;
            let testId = req.body.testId;
            let pcapData = req.body.pcapData;
            let testRun = job.testRuns[testId];
            if (!testRun) {
                return next(new BadRequest("no associated testrun found"));
            }
            for (let i = 0; i < testRun.TestCases.length; i++) {
                if (testRun.TestCases[i].uuid == uuid) {
                    // @ts-ignore
                    testRun.TestCases[i].PcapData = Buffer.from(pcapData, 'base64');
                    break;
                }
            }

            clearTimeout(job.testRunTimeouts[testId])
            job.testRunTimeouts[testId] = setTimeout(() => testRun.save(), 3000);
            res.json({status: "OK"});
        }

        private async updateStatus(req: Request, res: Response, next: NextFunction) {
            let jobId = req.body.jobId;
            let status = req.body.status;
            let job = AC.getJob(jobId as string);
            if (!job) {
                return next(new BadRequest("id not valid"));
            }
            job.status = status;
            if (status == AnvilJobStatus.TESTING && job.report) {
                if (req.body.totalTests) {
                    job.report.TotalTests = req.body.totalTests;
                }
                await job.report.save();
            }
            res.json({status: "OK"});
        }
    }
}

