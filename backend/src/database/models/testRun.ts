import { Model, Schema, Types } from "mongoose";
import { ScoreMapSchmaObject, calculateScoreDelta } from './score';
import { CategoriesStrings, IScoreDeltaMap, ITestResult, ITestRun } from "../../lib/data_types";
import DB from "../index"

export interface TestRunModel extends Model<ITestRun> {
  addTestResults(testRun: ITestRun & {_id: Types.ObjectId}): Promise<ITestRun & {_id: Types.ObjectId}>;
  overlayEdits(testRun: ITestRun & {_id: Types.ObjectId}): Promise<ITestRun & {_id: Types.ObjectId}>;
}

export const TestRunSchema = new Schema({
  Identifier: {
    type: String,
    required: true,
  },
  Date: Date,
  DispalyName: String,
  ElapsedTime: Number,
  FailedTests: Number,
  SucceededTests: Number,
  DisabledTests: Number,
  TotalTests: Number,
  Score: ScoreMapSchmaObject,
  StatesCount: Number,
  TestEndpointType: String,
  Running: Boolean
}, {
  statics: {
    async addTestResults(testRun: ITestRun & {_id: Types.ObjectId}) {
      const results = await DB.TestResult.aggregate([
        { $project: {States: 0}},
        { $match: {ContainerId: testRun._id} },
        { $group: {_id: "$TestMethod.ClassName", result: {$addToSet: "$$ROOT"}} }
      ]).exec();
      // reduce test results into object by id as key (classname -> methodname -> result)
      let resultMap = results.reduce(
          (classMap: {[id: string]: any}, resultArray: any) => {
              classMap[resultArray._id] = resultArray.result.reduce(
                (methodMap: {[id: string]: ITestResult}, resultObject: ITestResult) => {
                  methodMap[resultObject.TestMethod.MethodName] = resultObject;
                  return methodMap;
                }, {});
              return classMap;
          }, {});
      testRun.TestResults = resultMap;
      return testRun;
    },
    async overlayEdits(testRun: ITestRun & {_id: Types.ObjectId}) {
      const edits = DB.TestResultEdit.find({
        "$or": [
          {Containers: {"$in": [testRun._id.toString()]}},
          {Containers: null},
        ]
      }).sort({"createdAt": "asc"}).lean().exec()
      let resultScoreDelta: IScoreDeltaMap = {}
      if (testRun.TestResults) {
        for (let edit of (await edits)) {
          const result = testRun.TestResults[edit.ClassName][edit.MethodName]
    
          const scoreDelta = calculateScoreDelta(result.Score, edit.newOutcome)
          resultScoreDelta = {...resultScoreDelta, ...scoreDelta}
    
          result.Result = edit.newOutcome
          //result.edited = true
          //result.appliedEdit = <any>edit
          //result.matchingEdits = <any>edits
        }
      }
  
      for (const key of Object.keys(resultScoreDelta)) {
        const v = resultScoreDelta[<CategoriesStrings>key]
        const score = testRun.Score[<CategoriesStrings>key]
        score.Reached += v.ReachedDelta
        score.Total   += v.TotalDelta
        score.Percentage = (score.Reached / score.Total * 100)
      }
      return testRun;
    }
  },
  timestamps: true
})

TestRunSchema.index({Identifier: 1})
TestRunSchema.index({PcapStorageId: 1})
TestRunSchema.index({KeylogfileStorageId: 1})
