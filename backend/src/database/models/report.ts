import { Model, Schema, Types } from "mongoose";
import { IReport, ITestRun } from "../../lib/data_types";
import DB from "../index"
import { GuidelineReportSchema } from "./guidelineReport";

export interface ReportModel extends Model<IReport> {
  addTestRuns(report: IReport & {_id: Types.ObjectId}): Promise<IReport & {_id: Types.ObjectId}>;
  overlayEdits(report: IReport & {_id: Types.ObjectId}): Promise<IReport & {_id: Types.ObjectId}>;
}

export const ReportSchema = new Schema({
  Identifier: {
    type: String,
    required: true,
  },
  Date: Date,
  ElapsedTime: Number,
  PartiallyFailedTests: Number,
  FullyFailedTests: Number,
  ConceptuallySucceededTests: Number,
  StrictlySucceededTests: Number,
  DisabledTests: Number,
  TestSuiteErrorTests: Number,
  TotalTests: Number,
  FinishedTests: Number,
  Score: {
    type: Map,
    of: Number
  },
  TestCaseCount: Number,
  TestEndpointType: String,
  Running: Boolean,
  AnvilConfig: String,
  AdditionalConfig: String,
  GuidelineReports: [GuidelineReportSchema],
  KeylogFile: Types.ObjectId
}, {
  statics: {
    async addTestRuns(report: IReport & {_id: Types.ObjectId}) {
      const runs = await DB.TestRun.find({ContainerId: report._id}, "-TestCases").lean().exec();
      report.TestRuns = runs;
      return report;
    },
    async overlayEdits(report: IReport & {_id: Types.ObjectId}) {
      const edits = DB.TestRunEdit.find({
        "$or": [
          {Containers: {"$in": [report._id.toString()]}},
          {Containers: null},
        ]
      }).sort({"createdAt": "asc"}).lean().exec()
      /* let resultScoreDelta: IScoreDeltaMap = {}
      if (report.TestRuns) {
        for (let edit of (await edits)) {
          const run = report.TestRuns[edit.ClassName][edit.MethodName]
    
          const scoreDelta = calculateScoreDelta(run.Score, edit.newResult)
          resultScoreDelta = {...resultScoreDelta, ...scoreDelta}
    
          run.Result = edit.newResult
          //result.edited = true
          //result.appliedEdit = <any>edit
          //result.matchingEdits = <any>edits
        }
      }
  
      for (const key of Object.keys(resultScoreDelta)) {
        const v = resultScoreDelta[<CategoriesStrings>key]
        const score = report.Score[<CategoriesStrings>key]
        score.Reached += v.ReachedDelta
        score.Total   += v.TotalDelta
        score.Percentage = (score.Reached / score.Total * 100)
      } */
      return report;
    }
  },
  timestamps: true
})

ReportSchema.index({Identifier: 1})
ReportSchema.index({PcapStorageId: 1})
ReportSchema.index({KeylogfileStorageId: 1})
