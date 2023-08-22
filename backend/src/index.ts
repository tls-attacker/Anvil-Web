import cors from 'cors';
import express, { NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";
import * as OpenApiValidator from "express-openapi-validator";
import DB from './database';
import { UploadReportEndpoint } from './endpoints';
import { ReportEnpoint } from './endpoints/ReportEndpoint';
import { TestRunEndpoint } from './endpoints/TestRunEndpoint';
import { WorkerEndpoint } from './endpoints/WorkerEndpoint';
import { BadRequest, InternalServerError } from './errors';
import { ControllerEndpoint } from './endpoints/ControlEndpoint';

console.log("AnvilWeb starting...")
const app = express()

console.log(" - configuring frontend interface")
if (process.env.PRODUCTION) {
  app.use(express.static('static'))
}

console.log(" - configuriong backend api")
let router = express.Router()
app.use(express.json({
  limit: "1GB"
}));
app.use(cors());
app.use(fileUpload())
app.use(OpenApiValidator.middleware({
  apiSpec: '../openapi.yaml',
  validateResponses: true
}))
app.use('/api/v2', router)
// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // dump error to console for debug
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

new UploadReportEndpoint.Controller(router)
//new KeylogFileEndpoint.Controller(router)
//new PcapEndpoint.Controller(router)
new ReportEnpoint.Controller(router)
new TestRunEndpoint.Controller(router)
new WorkerEndpoint.Controller(router)
new ControllerEndpoint.Controller(router)


app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  //console.error(err.stack)
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof BadRequest) {
    res.status(400)
    res.send({success: false, error: err.message})
    return
  } else if (err instanceof InternalServerError) {
    res.status(500)
    res.send({success: false, error: err.message})
    return
  }

  next(err)
})

console.log(" - establishing database connection")
DB.connect().then(() => {
  app.listen(5001, function () {
    console.log('AnvilWeb started. Running on port 5001!')
  })
}).catch((e) => {
  console.error("Startup failed!", e)
})
