import { Schema } from "mongoose";

export const GuidelineSchema = new Schema({
    checkName: String,
    adherence: String,
    hint: String,
    info: String
}, {strict: false})

export const GuidelineReportSchema = new Schema({
  name: String,
  link: String,
  results: [GuidelineSchema]
})
