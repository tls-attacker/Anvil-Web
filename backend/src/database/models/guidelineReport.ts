import { Schema } from "mongoose";

export const GuidelineSchema = new Schema({
    id: String,
    name: String,
    result: String,
    display: String,
}, {strict: false})

export const GuidelineReportSchema = new Schema({
  name: String,
  link: String,
  passed: [GuidelineSchema],
  failed: [GuidelineSchema],
  uncertain: [GuidelineSchema],
  skipped: [GuidelineSchema]
})
