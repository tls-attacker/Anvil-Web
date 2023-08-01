import { BadRequest } from '../errors';
import { NextFunction, Request, Response, Router } from 'express'
import DB, { FileType } from '../database';
import { CategoriesStrings, IScoreDeltaMap, ITestRun, TestResult } from '../lib/data_types';
import { calculateScoreDelta } from '../database/models/score';
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
      this.router.get("/report/:identifier/testRuns/:className/:methodName", this.getTestRunsForReport.bind(this))
    }


    private async getIdentifiers(req: Request, res: Response, next: NextFunction) {
      const results = await DB.Report.find().select({Identifier: 1}).lean().exec()
      const identifiers = results.map((i: any) => i.Identifier)
      identifiers.sort()
      res.send(identifiers)
    }

    private async getReports(req: Request, res: Response, next: NextFunction) {
      const identifiers = req.query.identifiers as string[];
      let reports;
      if (identifiers === undefined) {
        reports = await DB.Report.find().lean().exec();
      } else {
        reports = await DB.Report.find({Identifier: {"$in": identifiers}}).lean().exec();
      }
      const detailed = req.query.detailed || false;
      
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
        report = structuredClone(job.report);
        report.Job = job.apiObject();
        // todo add test runs
        // ...
      } else {
        report = await DB.Report.findOne({Identifier: identifier}).lean().exec();
        if (!report) {
          return next(new BadRequest("invalid identifier"))
        }
        // add test runs
        await DB.Report.addTestRuns(report);
      }

      // overlay edits
      await DB.Report.overlayEdits(report);

      res.send(report);
    }


    private async deleteReport(req: Request, res: Response, next: NextFunction) {
      const doc = await DB.Report.findOne({ Identifier: req.params.identifier });
      if (!doc) {
        return next(new BadRequest("Invalid identifier"));
      }
      // delete all associated data
      await Promise.all([
        DB.Report.deleteMany({ ContainerId: doc._id }).exec(),
        DB.TestCase.deleteMany({ ContainerId: doc._id }).exec(),
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
      const className = req.params.className
      const methodName = req.params.methodName
    
      const report = await DB.Report.findOne({ Identifier: identifier }).select({_id: 1}).lean().exec()
      if (!report) {
        return next(new BadRequest("identifier not found"));
      }
      const testRun = await DB.TestRun.findOne({
        ContainerId: report._id.toString(), 
        'TestMethod.ClassName': className, 
        'TestMethod.MethodName': methodName
      }).lean().exec()

      if (!testRun) {
        return next(new BadRequest("testrun not found"));
      }

      await DB.TestRun.overlayEdits(testRun);
      DB.TestRun.countTestCases(testRun);
      res.send(testRun)
    }
  }
}