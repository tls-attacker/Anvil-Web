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
      const reportEntry = zipFile.getEntry("report.json")
      if (!summaryEntry && reportEntry) {
        await processNewReport(zipFile, res);
      } else if (!reportEntry && summaryEntry) {
        await processOldReport(zipFile, res);
      } else {
        res.send("No summary found")
        return
      }
    }
  }

  async function processOldReport(zipFile: AdmZip, res: Response) {
    // todo add backwards compatability
    const summaryEntry = zipFile.getEntry("summary.json")
    let summary = JSON.parse(summaryEntry.getData().toString())
    let exists = await DB.Report.findOne({Identifier: summary.Identifier}, {Identifier: 1}).lean().exec();
    if (exists != null) {
      res.send("Already exists")
      return
    }
    summary.Date = new Date(summary.Date)
    let testRun = new DB.Report(summary)
    await testRun.save()
    const entries = zipFile.getEntries()
    for (let entry of entries) {
      if (entry.entryName.endsWith("_containerResult.json")) {
        let containerResult = JSON.parse(entry.getData().toString())
        if (containerResult.States) { // backwards compatibillity
          containerResult.TestCases = containerResult.States;
          containerResult.CaseCount = containerResult.StatesCount;
          delete containerResult.States;
          delete containerResult.StatesCount;
        }
        let testResult = new DB.TestRun(containerResult)
        testResult.ContainerId = testRun._id
        testResult.save()
      }
    }

    res.send("OK")
  }

  async function processNewReport(zipFile: AdmZip, res: Response) {
    const reportEntry = zipFile.getEntry("report.json")
    let report = JSON.parse(reportEntry.getData().toString())
    let exists = await DB.Report.findOne({Identifier: report.Identifier}, {Identifier: 1}).lean().exec();
    if (exists != null) {
      res.send("Already exists")
      return
    }
    report.Date = new Date(report.Date)
    let testRun = new DB.Report(report)
    await testRun.save()
    const entries = zipFile.getEntries()
    for (let entry of entries) {
      if (entry.entryName.endsWith("_testRun.json")) {
        let containerResult = JSON.parse(entry.getData().toString())
        let testResult = new DB.TestRun(containerResult)
        testResult.ContainerId = testRun._id
        testResult.save()
      }
    }

    res.send("OK")
  }
}

