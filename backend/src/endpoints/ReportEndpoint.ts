import { BadRequest } from '../errors';
import { NextFunction, Request, Response, Router } from 'express'
import DB, { FileType } from '../database';
import { ITestRun, TestResult } from '../lib/data_types';
import { ObjectId } from 'mongoose';
import { AC } from '../controller/AnvilController';
import { AnvilJob } from '../controller/AnvilJob';


export namespace ReportEnpoint {


  export class Controller {
    private router: Router


    constructor(aRouter: Router) {
      this.router = aRouter

      // get all identifiers
      this.router.get("/reportIdentifiers", this.getIdentifiers.bind(this))
      // get multiple reports
      this.router.get("/report", this.getReports.bind(this))
      // show or delete single report
      this.router.route("/report/:identifier")
        .get(this.getReport.bind(this))
        .delete(this.deleteReport.bind(this))
      // get single test run from this report
      this.router.get("/report/:identifier/testRuns/:testId", this.getTestRunsForReport.bind(this))
    }


    private async getIdentifiers(req: Request, res: Response, next: NextFunction) {
      const results = await DB.Report.find().select({Identifier: 1}).lean().exec()
      const identifiers = results.map((i: any) => i.Identifier)
      identifiers.sort()
      res.send(identifiers)
    }

    private async getReports(req: Request, res: Response, next: NextFunction) {
      const identifiers = req.query.identifiers as string[];
      const detailed = req.query.detailed || false;

      let reports;
      if (identifiers === undefined) {
        reports = await DB.Report.find({}, detailed ? "" : "-GuidelineReports").lean().exec();
      } else {
        reports = await DB.Report.find({Identifier: {"$in": identifiers}}, detailed ? "" : "-GuidelineReports").lean().exec();
      }
      
      let promised = []
      if (detailed) {
        for (const report of reports) {
            promised.push(DB.Report.addTestRuns(report))
        }
        await Promise.all(promised);
      }
      promised = []
      for (const report of reports) {
        promised.push(DB.Report.overlayEdits(report))
      }
      await Promise.all(promised);
      res.json(reports)
    } 

    private async getReport(req: Request, res: Response, next: NextFunction) {
      const start = new Date().getTime()
      const identifier = req.params.identifier;
      let job = AC.getAllJobs().find(j => j.report && j.report.Identifier == identifier);
      let report;
      if (job) {
        report = job.report.toObject({flattenMaps: true});
        report.Job = job.apiObject();
        report.TestRuns = Object.values(job.testRuns).map(tR => tR.toObject({flattenMaps: true}));
      } else {
        report = await DB.Report.findOne({Identifier: identifier}).lean().exec();
        if (!report) {
          return next(new BadRequest("invalid identifier"))
        }
        // add test runs
        await DB.Report.addTestRuns(report);
        // overlay edits
        await DB.Report.overlayEdits(report);
      }

      res.send(report);
    }


    private async deleteReport(req: Request, res: Response, next: NextFunction) {
      const doc = await DB.Report.findOne({ Identifier: req.params.identifier });
      if (!doc) {
        return next(new BadRequest("Invalid identifier"));
      }
      // delete all associated data
      await Promise.all([
        DB.TestRun.deleteMany({ ContainerId: doc._id }).exec(),
        //DB.pcapBucket.delete(doc.PcapStorageId),
        //DB.keylogfileBucket.delete(doc.KeylogfileStorageId),
        doc.deleteOne()
      ]).then(() => {
        res.json({sucess: true})
      }).catch((e) => {
        next(e)
      })
    }

    private async getTestRunsForReport(req: Request, res: Response, next: NextFunction) {
      const identifier = req.params.identifier
      const testId = req.params.testId

      let job = AC.getAllJobs().find(j => j.report && j.report.Identifier == identifier);
      let testRun;
      if (job) {

        testRun = job.testRuns[testId].toObject({flattenMaps: true});

      } else {
    
        const report = await DB.Report.findOne({ Identifier: identifier }).select({_id: 1}).lean().exec()
        if (!report) {
          return next(new BadRequest("identifier not found"));
        }
        testRun = await DB.TestRun.findOne({
          ContainerId: report._id.toString(), 
          TestId: testId
        }, "-TestCases.PcapData").lean().exec()

        if (!testRun) {
          return next(new BadRequest("testrun not found"));
        }

        await DB.TestRun.overlayEdits(testRun);
        DB.TestRun.countTestCases(testRun);

      }
      res.send(testRun)
    }
  }
}