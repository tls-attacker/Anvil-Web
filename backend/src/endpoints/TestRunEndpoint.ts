import { NextFunction, Request, Response, Router } from 'express';
import DB from '../database';
import { BadRequest, InternalServerError } from '../errors';
import { EditMode, ITestRun, ITestRunEdit, TestResult } from '../lib/data_types';

export namespace TestRunEndpoint {


  export class Controller {
    private router: Router


    constructor(aRouter: Router) {
      this.router = aRouter

      // get multiple testruns
      this.router.get("/testRun/:className/:methodName", this.getTestRuns.bind(this))
      // edit one testrun
      this.router.post("/testRun/edit", this.submitEdit.bind(this))
    }

    private async getTestRuns(req: Request, res: Response, next: NextFunction) {
      const identifiers = <string[]>req.query.identifiers
      const className = req.params.className
      const methodName = req.params.methodName

      if (!identifiers) {
        return next(new BadRequest("Parameter identifiers is missing"))
      }

      const reports = await DB.Report
        .find({Identifier: {"$in": identifiers}})
        .select({
          Identifier: 1,
          ShortIdentifier: 1,
          "_id": 1,
        }).lean().exec();
    
      const testRuns = await DB.TestRun.find(
        {ContainerId: {"$in": reports.map(i => i._id)},
        "TestClass": className,
        "TestMethod": methodName
      }).lean().exec();

      if (testRuns.length == 0) {
        next(new BadRequest("No result found for the given identifiers."))
        return
      }

      const promised = []
      for (let testRun of testRuns) {
        promised.push(DB.TestRun.overlayEdits(testRun))
        promised.push(DB.TestRun.countTestCases(testRun))
      }
      await Promise.all(promised)

      let runMap = testRuns.reduce(
        (runMap: {[identifier: string]: ITestRun}, testRun: ITestRun) => {
          runMap[reports.find((r) => r._id.equals(testRun.ContainerId)).Identifier] = testRun;
          return runMap;
        }, {});
      res.json(runMap);
      
    }

    private async submitEdit(req: Request, res: Response, next: NextFunction) {
      interface Payload {
        editMode: EditMode,
        identifiers: string[],
        description: string,
        title: string,
        newResult: TestResult
        MethodName: string,
        ClassName: string
      }

      const data: Payload = req.body
      
      const doc: ITestRunEdit = {
        description: data.description,
        newResult: data.newResult,
        title: data.title,
        editMode: data.editMode,
        ClassName:  data.ClassName,
        MethodName: data.MethodName,
        Containers: null,
        Results: null,
      }
      
      const containerIds = await DB.Report.find({
        Identifier: {$in: data.identifiers}
      }).lean().select({_id: 1, "Identifier": 1}).exec().then((docs) => {
        return docs.map(i => i._id)
      })

      const runIds = await DB.TestRun.find({
        ContainerId: {$in: containerIds}, 
        "TestClass": data.ClassName, 
        "TestMethod": data.MethodName
      }).lean().exec().then((docs) => {
        return docs.map(i => i._id)
      })

      if (data.editMode !== EditMode.allAll) {
        doc.Containers = containerIds
        doc.Results = runIds
      }

      new DB.TestRunEdit(doc).save().then(() => {
        res.send({'success': true})
      }).catch((e) => {
        next(new InternalServerError(e))
      })
    }
  }
}


