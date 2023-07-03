import { ITestMethod, ITestResult, ITestResultContainer } from '../database/models';
import { IScoreMap } from "../database/models/score";
import { IItemProviderContext, Optional, resolveStatus } from '../../lib/const';
import { allScoreCategories } from '../../lib/const/ScoreCategories';

export interface ITestResultTable extends ITestResult {
  statusIcons: string
}

//@ts-ignore
interface ITestResultContainerBrowser extends ITestResultContainer {
  TestResultClassMethodIndexMap: {[key: string]: number}
}

function timeConversion(millisec: number) {
  var seconds = parseFloat((millisec / 1000).toFixed(1));
  var minutes = parseFloat((millisec / (1000 * 60)).toFixed(1));
  var hours = parseFloat((millisec / (1000 * 60 * 60)).toFixed(1));
  var days = parseFloat((millisec / (1000 * 60 * 60 * 24)).toFixed(1));
  if (seconds < 60) {
      return `${seconds}sec`;
  } else if (minutes < 60) {
      return `${minutes}min`;
  } else if (hours < 24) {
      return `${hours}h`;
  } else {
      return `${days}d`
  }
}

export function itemProvider(ctx: IItemProviderContext, reports: ITestResultContainerBrowser[]) {
  if (reports.length == 0) {
    return []
  }
  const items: any[] = []
  for (const i of allScoreCategories) {
    items.push({
      testcase: `Score ${i}`
    })
  }

  items.push({
    testcase: "Succeeded tests"
  },{
    testcase: "Failed tests"
  },{
    testcase: "Disabled tests"
  },{
    testcase: "# TLS Handshakes"
  },{
    testcase: "Execution time"
  })

  // build test case column first
  const descriptions = new Set<string>()
  const resultIndexReportMap = new Map<string, number[]>()

  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]

    for (let j = 0; j < allScoreCategories.length; j++) {
      const category = allScoreCategories[j]
      if (report.Score[category]) {
        items[j][report.Identifier] = {statusIcons: `${report.Score[category].Reached}/${report.Score[category].Total} (${report.Score[category].Percentage.toFixed(2)}%)`}
      } else {
        items[j][report.Identifier] = {statusIcons: ""}
      }
      
    }

    const c = allScoreCategories.length;
    items[c][report.Identifier] = {statusIcons: report.SucceededTests}
    items[c+1][report.Identifier] = {statusIcons: report.FailedTests}
    items[c+2][report.Identifier] = {statusIcons: report.DisabledTests}
    items[c+3][report.Identifier] = {statusIcons: report.StatesCount}
    items[c+4][report.Identifier] = {statusIcons: timeConversion(report.ElapsedTime)}

    for (let testMethod of Object.keys(report.TestResultClassMethodIndexMap)) {
      descriptions.add(testMethod)
      let positions = resultIndexReportMap.get(testMethod)
      if (!positions) {
        positions = Array.apply(null, Array(reports.length)).map(() => -1)
        resultIndexReportMap.set(testMethod, positions)
      }

      positions[i] = report.TestResultClassMethodIndexMap[testMethod]
    }
  }

  const descriptionsArr = new Array(...descriptions)
  descriptionsArr.sort((a, b) => {
    if (a < b) {
      return -1
    } else if (b < a) {
      return 1
    }

    return 0
  })


  let oldTestClass = ""
  for (let testCase of descriptionsArr) {
    const testResultIndexes = resultIndexReportMap.get(testCase)!
    let scoreMap : Optional<IScoreMap> = null
    let testMethod : Optional<ITestMethod> = null
    for (let idx in testResultIndexes) {
      let elem = testResultIndexes[idx]
      if (elem != -1) {
        scoreMap = reports[idx].TestResults[elem].Score
        testMethod = reports[idx].TestResults[elem].TestMethod
        break
      }
    }

    if (!testMethod) {
      continue
    }
    
    const item: any = {
      testcase: {
        value: `&nbsp;&nbsp;&nbsp;&nbsp;${testMethod.MethodName}`,
        TestMethod: testMethod
      }
    }
    for (let i=0; i < reports.length; i++) {
      const report = reports[i]
      const testResultIndex = testResultIndexes[i]
      if (testResultIndex == -1 || report.TestResults[testResultIndex].Result == "DISABLED") {
        item[report.Identifier] = null
      } else {
        const result = <ITestResultTable>report.TestResults[testResultIndex]
        result.statusIcons = resolveStatus(result.Result)
	if (result.HasVaryingAdditionalResultInformation) {
          result.statusIcons += "⁉️"
        } else if (result.HasStateWithAdditionalResultInformation) {
          result.statusIcons += "❗️"
        }
        item[report.Identifier] = result
      }
    }

    let onlyNull = true
    for (let i in item) {
      if (i === "testcase") continue
      if (item[i] != null) {
        onlyNull = false
        break
      }
    }

    if (onlyNull) {
      continue
    }

    if (testMethod.ClassName != oldTestClass) {
      oldTestClass = testMethod.ClassName
      items.push({
        testcase: {
          value: oldTestClass.replace("de.rub.nds.tlstest.suite.tests.", "")
        }
      })
    }

    items.push(item)
  }

  return items
}


export function getRowClass(item: any[]) {
  let hasStates = false
  const retClasses = []

  for (const i in item) {
    let result : ITestResult = item[i] 
    if (!result || !result.Result || i == 'testcase') continue

    if (result.States.length > 0) {
      hasStates = true
    }
  }

  if (!hasStates) {
    retClasses.push("notSelectable")
  }

  return retClasses
}

