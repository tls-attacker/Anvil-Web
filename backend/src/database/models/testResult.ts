import { TestMethodSchemaObject } from "./testMethod";
import { Model, ObjectId, Schema, Types } from 'mongoose';
import { ScoreMapSchmaObject, calculateScoreDelta } from './score';
import { ITestResult, TestOutcome } from "../../lib/data_types";
import DB from "../index"
import { StateSchema } from "./state";

export interface TestResultModel extends Model<ITestResult> {
  overlayEdits(testResult: ITestResult & {_id: Types.ObjectId}): Promise<ITestResult & {_id: Types.ObjectId}>;
  countStateResults(testResult: ITestResult & {_id: Types.ObjectId}): Promise<ITestResult & {_id: Types.ObjectId}>;
}

export const TestResultSchema = new Schema({
  ContainerId: {
    type: Schema.Types.ObjectId,
    ref: 'TestRun',
    required: true
  },
  TestMethod: TestMethodSchemaObject,
  Result: String,
  HasStateWithAdditionalResultInformation: Boolean,
  HasVaryingAdditionalResultInformation: Boolean,
  DisabledReason: String,
  FailedReason: String,
  FailedStacktrace: String,
  ElapsedTime: Number,
  States: [StateSchema],
  StatesCount: Number,
  Score: ScoreMapSchmaObject,
  FailureInducingCombinations: [{
    type: Schema.Types.Map,
    of: String,
    default: new Map()
  }]
},
{
  statics: {
    async overlayEdits(testResult: ITestResult & {_id: Types.ObjectId}) {
      const edits = await DB.TestResultEdit.find({
        "$or": [
          {Containers: {"$in": [testResult.ContainerId.toString()]}},
          {Containers: null},
        ],
        MethodName: testResult.TestMethod.MethodName,
        ClassName: testResult.TestMethod.ClassName
      }).sort({createdAt: 'desc'}).lean().exec()

      if (edits.length > 1) {
        //console.warn(`Multiple edits were found targeting ${testResult.TestMethod.ClassName.replace("de.rub.nds.tlstest.suite.tests.", "")}.${testResult.TestMethod.MethodName}@${identifier}`)
        console.warn("Only evaluating the newest one")
      }

      if (edits.length > 0) {
        testResult.Result = edits[0].newOutcome
        //result.edited = true
        //result.appliedEdit = <any>edits[0]
        //result.matchingEdits = <any>edits

        // updates result.Score inplace
        calculateScoreDelta(testResult.Score, edits[0].newOutcome)
      }

      return testResult;
    },
    countStateResults(testResult: ITestResult & {_id: Types.ObjectId}) {
      let sucStates = 0;
      let conSucStates = 0;
      let failedStates = 0;
      for (let state of testResult.States) {
        switch (state.Result) {
          case TestOutcome.STRICTLY_SUCCEEDED: sucStates++; break;
          case TestOutcome.CONCEPTUALLY_SUCCEEDED: conSucStates++; break;
          case TestOutcome.FULLY_FAILED: failedStates++; break;
        }
      }
      testResult.SucceededStates = sucStates;
      testResult.ConSucceededStates = conSucStates;
      testResult.FailedStates = failedStates;

      return testResult;
    }
  }
})


TestResultSchema.index({Result: 1})

// This index also helps with searches just for ContainerId
// https://docs.mongodb.com/manual/core/index-compound/
TestResultSchema.index({ContainerId: 1, "TestMethod.ClassName": 1, "TestMethod.MethodName": 1})
