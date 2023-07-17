import { BadRequest } from '../errors';
import { NextFunction, Request, Response, Router } from 'express'
import DB, { FileType } from '../database';
import { CategoriesStrings, IScoreDeltaMap, ITestResult, TestOutcome } from '../lib/data_types';
import { calculateScoreDelta } from '../database/models/score';
import { ObjectId } from 'mongoose';


export namespace TestRunEnpoint {


  export class Controller {
    private router: Router


    constructor(aRouter: Router) {
      this.router = aRouter

      // get all identifiers
      this.router.get("/testRunIdentifiers", this.getIdentifiers.bind(this))
      // get multiple testruns
      this.router.get("/testRuns", this.getTestRuns.bind(this))
      // show or delete single test run
      this.router.route("/testRuns/:identifier")
        .get(this.getTestRun.bind(this))
        .delete(this.deleteTestRun.bind(this))
      // get single test result from this run
      this.router.get("/testRuns/:identifier/testResults/:className/:methodName", this.getTestResultForTestRun.bind(this))
    }


    private async getIdentifiers(req: Request, res: Response, next: NextFunction) {
      const results = await DB.TestRun.find().select({Identifier: 1}).lean().exec()
      const identifiers = results.map((i: any) => i.Identifier)
      identifiers.sort()
      res.send(identifiers)
    }

    private async getTestRuns(req: Request, res: Response, next: NextFunction) {
      const identifiers = req.query.identifiers as string[];
      let testRuns
      if (identifiers === undefined) {
        testRuns = await DB.TestRun.find().lean().exec();
      } else {
        testRuns = await DB.TestRun.find({Identifier: {"$in": identifiers}}).lean().exec();
      }
      const detailed = req.query.detailed || false;
      
      let promised = []
      if (detailed) {
        for (const testRun of testRuns) {
            promised.push(DB.TestRun.addTestResults(testRun))
        }
        await Promise.all(promised);
      }
      promised = []
      for (const testRun of testRuns) {
        promised.push(DB.TestRun.overlayEdits(testRun))
      }
      await Promise.all(promised);
      res.json(testRuns)
    } 

    private async getTestRun(req: Request, res: Response, next: NextFunction) {
      const start = new Date().getTime()
      const identifier = req.params.identifier
      const testRun = await DB.TestRun.findOne({Identifier: identifier}).lean().exec()
      if (!testRun) {
        return next(new BadRequest("invalid identifier"))
      }

      // add test results
      await DB.TestRun.addTestResults(testRun);

      // overlay edits
      await DB.TestRun.overlayEdits(testRun);

      res.send(testRun);
    }


    private async deleteTestRun(req: Request, res: Response, next: NextFunction) {
      const doc = await DB.TestRun.findOne({ Identifier: req.params.identifier });
      if (!doc) {
        next(new BadRequest("Invalid identifier"))
      }
      // delete all associated data
      await Promise.all([
        DB.TestResult.deleteMany({ ContainerId: doc._id }).exec(),
        DB.TestResultState.deleteMany({ ContainerId: doc._id }).exec(),
        //DB.pcapBucket.delete(doc.PcapStorageId),
        //DB.keylogfileBucket.delete(doc.KeylogfileStorageId),
        doc.deleteOne()
      ]).then(() => {
        res.json({sucess: true})
      }).catch((e) => {
        next(e)
      })
    }

    private async getTestResultForTestRun(req: Request, res: Response, next: NextFunction) {
      const identifier = req.params.identifier
      const className = req.params.className
      const methodName = req.params.methodName
    
      const testRun = await DB.TestRun.findOne({ Identifier: identifier }).select({_id: 1}).lean().exec()
      if (!testRun) {
        return next(new BadRequest("identifier not found"));
      }
      const result = await DB.TestResult.findOne({
        ContainerId: testRun._id.toString(), 
        'TestMethod.ClassName': className, 
        'TestMethod.MethodName': methodName
      }).lean().exec()

      if (!result) {
        return next(new BadRequest("testresult not found"));
      }

      await DB.TestResult.overlayEdits(result);
      DB.TestResult.countStateResults(result);
      res.send(result)
    }
  }
}