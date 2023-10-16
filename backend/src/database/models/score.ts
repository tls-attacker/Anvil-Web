import { SeverityLevel, TestResult } from '../../lib/data_types';


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

