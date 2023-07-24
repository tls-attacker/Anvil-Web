import { Schema } from 'mongoose';


export const TestRunEditSchema = new Schema({
  TestRuns: [{
    type: Schema.Types.ObjectId,
    ref: 'TestRun',
  }],
  Containers: [{
    type: Schema.Types.ObjectId,
    ref: 'Report',
  }],
  title: String,
  description: String,
  editMode: String,
  newResult: String,
  MethodName: String,
  ClassName: String
}, {
  timestamps: true
})

TestRunEditSchema.index({"Containers": 1, "ClassName": 1, "MethodName": 1})
TestRunEditSchema.index({"Results": 1, "ClassName": 1, "MethodName": 1})
TestRunEditSchema.index({"ClassName": 1, "MethodName": 1})
