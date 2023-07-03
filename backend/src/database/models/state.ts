import { Schema } from "mongoose";


export const StateSchema = new Schema({
  DerivationContainer: {
    type: Schema.Types.Map,
    of: String,
    default: new Map()
  },
  DisplayName: String,
  Result: String,
  AdditionalResultInformation: String,
  AdditionalTestInformation: String,
  SrcPort: Number,
  DstPort: Number,
  StartTimestamp: String,
  EndTimestamp: String,
  uuid: String,
  Stacktrace: String
})

StateSchema.index({Result: 1})
StateSchema.index({AdditionalResultInformation: 1})
StateSchema.index({Stacktrace: 1})
