import { Schema } from 'mongoose';


export const TestResultEditSchema = new Schema({
  Results: [{
    type: Schema.Types.ObjectId,
    ref: 'TestResult',
  }],
  Containers: [{
    type: Schema.Types.ObjectId,
    ref: 'TestRun',
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

TestResultEditSchema.index({"Containers": 1, "ClassName": 1, "MethodName": 1})
TestResultEditSchema.index({"Results": 1, "ClassName": 1, "MethodName": 1})
TestResultEditSchema.index({"ClassName": 1, "MethodName": 1})
