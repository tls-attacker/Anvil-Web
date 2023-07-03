import AdmZip from "adm-zip";
import { NextFunction, Request, Response, Router } from 'express';
import fileUpload from "express-fileupload";
import DB from '../database';


export namespace UploadReportEndpoint {

  export class Controller {
    private router: Router

    constructor(router: Router) {
      this.router = router
      router.post("/uploadReport", this.uploadReport)
    }

    private async uploadReport(req: Request, res: Response, next: NextFunction) {
      const file = req.files.report as fileUpload.UploadedFile
      const zipFile = new AdmZip(file.data)
      const summaryEntry = zipFile.getEntry("summary.json")
      if (!summaryEntry) {
        res.send("No summary found")
        return
      }
      let summary = JSON.parse(summaryEntry.getData().toString())
      let exists = await DB.TestRun.findOne({Identifier: summary.Identifier}, {Identifier: 1}).lean().exec();
      if (exists != null) {
        res.send("Already exists")
        return
      }
      summary.Date = new Date(summary.Date)
      let testRun = new DB.TestRun(summary)
      await testRun.save()
      const entries = zipFile.getEntries()
      for (let entry of entries) {
        if (entry.entryName.endsWith("_containerResult.json")) {
          let containerResult = JSON.parse(entry.getData().toString())
          let testResult = new DB.TestResult(containerResult)
          testResult.ContainerId = testRun._id
          testResult.save()
        }
      }
      res.send("OK")
    }
  }
}

