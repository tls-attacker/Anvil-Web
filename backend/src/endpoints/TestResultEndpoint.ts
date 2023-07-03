import { NextFunction, Request, Response, Router } from 'express';
import DB from '../database';
import { BadRequest, InternalServerError } from '../errors';
import { EditMode, ITestResultEdit, TestOutcome } from '../lib/data_types';

enum RespFormat {
  html = "html",
  raw = "raw"
}

export namespace TestResultEndpoint {


  export class Controller {
    private router: Router


    constructor(aRouter: Router) {
      this.router = aRouter

      // get multiple testresults
      this.router.get("/testResult/:className/:methodName", this.getTestResults.bind(this))
      // edit one testresult
      this.router.post("/testResult/edit", this.submitEdit.bind(this))
    }

    private async getTestResults(req: Request, res: Response, next: NextFunction) {
      const identifiers = <string[]>req.query.identifiers
      const className = req.params.className
      const methodName = req.params.methodName

      if (!identifiers) {
        return next(new BadRequest("Parameter identifiers is missing"))
      }

      const testRuns = await DB.TestRun
        .find({Identifier: {"$in": identifiers}})
        .select({
          Identifier: 1,
          ShortIdentifier: 1,
          "_id": 1,
        }).lean().exec()
        testRuns.sort((a,b) => {
        return identifiers.indexOf(a.Identifier) - identifiers.indexOf(b.Identifier)
      })
    
      const testResults = await DB.TestResult.find(
        {ContainerId: {"$in": testRuns.map(i => i._id)},
        "TestMethod.ClassName": className,
        "TestMethod.MethodName": methodName
      }).populate("States").lean().exec();

      if (testResults.length == 0) {
        next(new BadRequest("No result found for the given identifiers."))
        return
      }

      const promised = []
      for (let testResult of testResults) {
        promised.push(DB.TestResult.overlayEdits(testResult))
        promised.push(DB.TestResult.countStateResults(testResult))
      }
      await Promise.all(promised)
      res.json(testResults)
      
    }

    private async submitEdit(req: Request, res: Response, next: NextFunction) {
      interface Payload {
        editMode: EditMode,
        identifiers: string[],
        description: string,
        title: string,
        newResult: TestOutcome
        MethodName: string,
        ClassName: string
      }

      const data: Payload = req.body
      
      const doc: ITestResultEdit = {
        description: data.description,
        newOutcome: data.newResult,
        title: data.title,
        editMode: data.editMode,
        ClassName:  data.ClassName,
        MethodName: data.MethodName,
        Containers: null,
        Results: null,
      }
      
      const containerIds = await DB.TestRun.find({
        Identifier: {$in: data.identifiers}
      }).lean().select({_id: 1, "Identifier": 1}).exec().then((docs) => {
        return docs.map(i => i._id)
      })

      const resultIds = await DB.TestResult.find({
        ContainerId: {$in: containerIds}, 
        "TestMethod.ClassName": data.ClassName, 
        "TestMethod.MethodName": data.MethodName
      }).lean().exec().then((docs) => {
        return docs.map(i => i._id)
      })

      if (data.editMode !== EditMode.allAll) {
        doc.Containers = containerIds
        doc.Results = resultIds
      }

      new DB.TestResultEdit(doc).save().then(() => {
        res.send({'success': true})
      }).catch((e) => {
        next(new InternalServerError(e))
      })
    }
  }
}


