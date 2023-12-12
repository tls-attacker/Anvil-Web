// @ts-nocheck

import { spawnSync } from 'child_process';
import { NextFunction, Request, Response, Router } from 'express';
import fs, { promises as fsPromises } from 'fs';
import { IState, ITestRun } from '../lib/data_types';
import moment from 'moment';
import DB, { FileType } from '../database';
import { AC } from '../controller/AnvilController';
import { TestRunEditSchema } from 'database/models';



export namespace PcapEndpoint {
  export class Controller {
    private router: Router

    constructor(aRouter: Router) {
      this.router = aRouter

      this.router.get("/report/:identifier/testRuns/:testId/:uuid/pcap", this.getPcap.bind(this))
      this.router.get("/report/:identifier/testRuns/:testId/:uuid/traffic", this.displayPcap.bind(this))
    }


    private async getPcap(req: Request, res: Response, next: NextFunction) {
      const identifier = req.params.identifier
      const testId = req.params.testId
      const uuid = req.params.uuid

      let job = AC.getAllJobs().find(j => j.report && j.report.Identifier == identifier);
      let testRun;
      if (job) {
        testRun = job.testRuns[testId];
      } else {
        const report = await DB.Report.findOne({ Identifier: identifier }).select({_id: 1}).lean().exec()
        if (!report) {
          return next(new BadRequest("identifier not found"));
        }
        testRun = await DB.TestRun.findOne({
          ContainerId: report._id.toString(), 
          TestId: testId
        });
      }
      let pcap;
      if (!testRun.TestCases) {
        return next(new BadRequest("no testcases found"));
      }
      for (let testCase of testRun.TestCases) {
        if (testCase.uuid === uuid) {
           pcap = testCase.PcapData;
           break;
        }
      }
      if (pcap) {
        res.type('application/octet-stream')
        res.send(pcap)
      } else {
        res.status(204)
        res.send()
      }
    }

    private async displayPcap(req: Request, res: Response, next: NextFunction) {
      const identifier = req.params.identifier
      const testId = req.params.testId
      const uuid = req.params.uuid

      let job = AC.getAllJobs().find(j => j.report && j.report.Identifier == identifier);
      let testRun;
      if (job) {
        testRun = job.testRuns[testId];
      } else {
        const report = await DB.Report.findOne({ Identifier: identifier }).select({_id: 1}).lean().exec()
        if (!report) {
          return next(new BadRequest("identifier not found"));
        }
        testRun = await DB.TestRun.findOne({
          ContainerId: report._id.toString(), 
          TestId: testId
        });
      }
      let pcap;
      if (!testRun.TestCases) {
        return next(new BadRequest("no testcases found"));
      }
      for (let testCase of testRun.TestCases) {
        if (testCase.uuid === uuid) {
           pcap = testCase.PcapData;
           break;
        }
      }

      if (pcap) {
        let output = await this.execProgram(pcap, 
          //'tshark', 
          'C:\\Program Files\\Wireshark\\tshark.exe',
          [
            '-n', '-r', '-',
            //'-o', `tls.keylog_file:/tmp/k${container.KeylogfileStorageId}`,
            '-o', 'gui.column.format:"Time","%Aut","s","%uS","d","%uD","Protocol","%p","Info","%i"',
            '-T', 'tabs'
          ]
        )

        res.type("text/plain")
        res.send(output)
      } else {
        res.status(204)
        res.send()
      }
    }

    private async execProgram(stdin: Buffer, program: string, args: string[]): Promise<Buffer> {
      const env = {...process.env}
      env.COLORTERM="24bit"
      env.TERM="xterm-256color"
      env.COLORFGBG="7;0"
      env.LSCOLORS="Gxfxcxdxbxegedabagacad"
      env.ITERM_PROFILE="Default"
      env.LC_TERMINAL="iTerm2"
    
      return new Promise((res) => {
        const ret = spawnSync(program, args, {
          input: stdin || 'pipe',
          env: env,
        })
        console.error(ret.stderr.toString('utf-8'))
        res(ret.stdout)
      })
    }
    
  }
}












