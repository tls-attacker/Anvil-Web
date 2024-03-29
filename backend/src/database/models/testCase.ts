import { Schema } from "mongoose";


export const TestCaseSchema = new Schema({
  ParameterCombination: {
    type: Schema.Types.Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },
  DisplayName: String,
  Result: String,
  AdditionalResultInformation: [String],
  AdditionalTestInformation: [String],
  SrcPort: Number,
  DstPort: Number,
  StartTimestamp: String,
  EndTimestamp: String,
  uuid: String,
  Stacktrace: String,
  PcapData: Buffer
})

TestCaseSchema.index({Result: 1})
TestCaseSchema.index({AdditionalResultInformation: 1})
TestCaseSchema.index({Stacktrace: 1})
