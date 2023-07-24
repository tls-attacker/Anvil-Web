import { CategoriesStrings, IScoreDeltaMap, IScoreMap, SeverityLevel, TestResult } from '../../lib/data_types';


export const ScoreSchemaObject = {
  Total: Number,
  Reached: Number,
  Percentage: Number,
  SeverityLevel: String
}


export const ScoreMapSchmaObject = {
  ALERT: ScoreSchemaObject,
  CVE: ScoreSchemaObject,
  CERTIFICATE: ScoreSchemaObject,
  CRYPTO: ScoreSchemaObject,
  DEPRECATED: ScoreSchemaObject,
  HANDSHAKE: ScoreSchemaObject,
  MESSAGESTRUCTURE: ScoreSchemaObject,
  RECORDLAYER: ScoreSchemaObject,
  INTEROPERABILITY: ScoreSchemaObject,
  SECURITY: ScoreSchemaObject,
  COMPLIANCE: ScoreSchemaObject
}

function scoreForStatus(status: TestResult, total: number): number {
  switch (status) {
    case TestResult.STRICTLY_SUCCEEDED:
      return 1.0 * total
    case TestResult.CONCEPTUALLY_SUCCEEDED:
      return 0.8 * total
    case TestResult.PARTIALLY_FAILED:
      return 0.2 * total
    default:
      return 0
  }
}

export function score(severityLevel: SeverityLevel, status: TestResult): number {
  switch (severityLevel) {
    case SeverityLevel.INFORMATIONAL:
      return scoreForStatus(status, 20)
    case SeverityLevel.LOW:
      return scoreForStatus(status, 40)
    case SeverityLevel.MEDIUM:
      return scoreForStatus(status, 60)
    case SeverityLevel.HIGH:
      return scoreForStatus(status, 80)
    case SeverityLevel.CRITICAL:
      return scoreForStatus(status, 100)
  }
}


export function calculateScoreDelta(scoreMap: IScoreMap, newResult: TestResult): IScoreDeltaMap {
  const r: IScoreDeltaMap = {}

  for (const [key, value] of Object.entries(scoreMap)) {
    const newReached = score(value.SeverityLevel, newResult)
    const reachedDelta = newReached - value.Reached
    
    const newTotal = newResult === TestResult.DISABLED ? 0 : score(value.SeverityLevel, TestResult.STRICTLY_SUCCEEDED)
    const totalDelta =  newTotal - value.Total

    r[<CategoriesStrings>key] = {
      TotalDelta: totalDelta,
      ReachedDelta: reachedDelta
    }

    const tmp = scoreMap[<CategoriesStrings>key]
    tmp.Reached += reachedDelta
    tmp.Total += totalDelta
    tmp.Percentage = tmp.Reached / tmp.Total * 100
  }

  return r
}

