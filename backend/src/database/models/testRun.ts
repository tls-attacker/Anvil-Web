import { TestMethodSchemaObject } from "./testMethod";
import { Model, ObjectId, Schema, Types } from 'mongoose';
import { ScoreMapSchmaObject, calculateScoreDelta } from './score';
import { ITestRun, TestResult } from "../../lib/data_types";
import DB from "../index"
import { TestCaseSchema } from "./testCase";

export interface TestRunModel extends Model<ITestRun> {
  overlayEdits(testRun: ITestRun & {_id: Types.ObjectId}): Promise<ITestRun & {_id: Types.ObjectId}>;
  countTestCases(testRun: ITestRun & {_id: Types.ObjectId}): Promise<ITestRun & {_id: Types.ObjectId}>;
}

export const TestRunSchema = new Schema({
  ContainerId: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  TestMethod: String,
  TestClass: String,
  Result: String,
  HasStateWithAdditionalResultInformation: Boolean,
  HasVaryingAdditionalResultInformation: Boolean,
  DisabledReason: String,
  FailedReason: String,
  ElapsedTime: Number,
  TestCases: [TestCaseSchema],
  CaseCount: Number,
  Score: ScoreMapSchmaObject,
  FailureInducingCombinations: [{
    type: Schema.Types.Map,
    of: String,
    default: new Map()
  }]
},
{
  statics: {
    async overlayEdits(testRun: ITestRun & {_id: Types.ObjectId}) {
      const edits = await DB.TestRunEdit.find({
        "$or": [
          {Containers: {"$in": [testRun.ContainerId.toString()]}},
          {Containers: null},
        ],
        MethodName: testRun.TestMethod,
        ClassName: testRun.TestClass
      }).sort({createdAt: 'desc'}).lean().exec()

      if (edits.length > 1) {
        //console.warn(`Multiple edits were found targeting ${testResult.TestClass.replace("de.rub.nds.tlstest.suite.tests.", "")}.${testResult.TestMethod}@${identifier}`)
        console.warn("Only evaluating the newest one")
      }

      if (edits.length > 0) {
        testRun.Result = edits[0].newResult
        //result.edited = true
        //result.appliedEdit = <any>edits[0]
        //result.matchingEdits = <any>edits

        // updates result.Score inplace
        calculateScoreDelta(testRun.Score, edits[0].newResult)
      }

      return testRun;
    },
    countTestCases(testRun: ITestRun & {_id: Types.ObjectId}) {
      let sucCases = 0;
      let conSucCases = 0;
      let failedCases = 0;
      for (let testCase of testRun.TestCases) {
        switch (testCase.Result) {
          case TestResult.STRICTLY_SUCCEEDED: sucCases++; break;
          case TestResult.CONCEPTUALLY_SUCCEEDED: conSucCases++; break;
          case TestResult.FULLY_FAILED: failedCases++; break;
        }
      }
      testRun.SucceededCases = sucCases;
      testRun.ConSucceededCases = conSucCases;
      testRun.FailedCases = failedCases;

      return testRun;
    }
  }
})


TestRunSchema.index({Result: 1})

// This index also helps with searches just for ContainerId
// https://docs.mongodb.com/manual/core/index-compound/
TestRunSchema.index({ContainerId: 1, "TestClass": 1, "TestMethod": 1})
