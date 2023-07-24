interface ITimestamp {
    createdAt: Date,
    updatedAt: Date
}

export interface ITestCase {
    TestResultId: string
    ContainerId: string
    DerivationContainer: { [identifier: string]: string }
    DisplayName: string
    Result: string
    AdditionalResultInformation: string
    AdditionalTestInformation: string
    SrcPort: number
    DstPort: number
    StartTimestamp: string
    EndTimestamp: string
    uuid: string
    Stacktrace?: string
}

export interface IScore {
    Total: number,
    Reached: number,
    Percentage: number,
    SeverityLevel: SeverityLevel
}

export type IScoreMap = {
    [identifier in CategoriesStrings]: IScore;
};


export type IScoreDeltaMap = {
    [i in CategoriesStrings]?: {
        TotalDelta: number;
        ReachedDelta: number;
    };
};

export enum SeverityLevel {
    INFORMATIONAL = "INFORMATIONAL",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

export enum ScoreCategories {
    ALERT = "ALERT",
    CVE = "CVE",
    CERTIFICATE = "CERTIFICATE",
    CRYPTO = "CRYPTO",
    DEPRECATED = "DEPRECATED",
    HANDSHAKE = "HANDSHAKE",
    MESSAGESTRUCTURE = "MESSAGESTRUCTURE",
    RECORDLAYER = "RECORDLAYER",
    SECURITY = "SECURITY",
    INTEROPERABILITY = "INTEROPERABILITY",
    COMPLIANCE = "COMPLIANCE"
}

export type CategoriesStrings = keyof typeof ScoreCategories

export enum EditMode {
    selected = "selected",
    allAll = "allAll",
    specified = "specified",
    allAvailable = "allAvailable"
}

export enum TestResult {
    STRICTLY_SUCCEEDED = "STRICTLY_SUCCEEDED",
    FULLY_FAILED = "FULLY_FAILED",
    PARTIALLY_FAILED = "PARTIALLY_FAILED",
    CONCEPTUALLY_SUCCEEDED = "CONCEPTUALLY_SUCCEEDED",
    DISABLED = "DISABLED",
    PARSER_ERROR = "PARSER_ERROR",
    NOT_SPECIFIED = "NOT_SPECIFIED",
    INCOMPLETE = "INCOMPLETE"
}


export interface IReport extends ITimestamp {
    Identifier: string,
    Date: Date,
    DisplayName: string,
    Running: boolean,
    ElapsedTime: number,
    FailedTests: number,
    SucceededTests: number,
    DisabledTests: number,
    TotalTests: number,
    FinishedTests: number,
    StatesCount: number,
    Score: IScoreMap,
    TestEndpointType: string,
    TestRuns?: {[key: string]: {[key: string]: ITestRun}},
    Job?: IAnvilJob,
    Config: string
}

export interface ITestRunEdit {
    Results?: (string|any)[],
    Containers?: (string|any)[],
    description: string,
    title: string,
    editMode: EditMode,
    newResult: TestResult,
    MethodName: string,
    ClassName: string,
}

export interface ITestRun {
    ContainerId: string | any,
    TestMethod: ITestMethod,
    Result: TestResult,
    HasStateWithAdditionalResultInformation: boolean,
    HasVaryingAdditionalResultInformation: boolean,
    DisabledReason?: string,
    FailedReason?: string,
    FailedStacktrace?: string,
    ElapsedTime: number,
    TestCases: ITestCase[],
    CaseCount: number,
    SucceededCases: number,
    ConSucceededCases: number,
    FailedCases: number,
    Score: IScoreMap,
    FailureInducingCombinations: { [key: string]: string }[]
}

export interface ITestMethod {
    Description: string,
    TestDescription: string,
    TlsVersion: string,
    RFC: {
        Section: string,
        number: number
    }
    MethodName: string,
    DisplayName: string,
    ClassName: string
}

export interface ITestCase {
    DerivationContainer: { [identifier: string]: string }
    DisplayName: string
    Result: string
    AdditionalResultInformation: string
    AdditionalTestInformation: string
    SrcPort: number
    DstPort: number
    StartTimestamp: string
    EndTimestamp: string
    uuid: string
    Stacktrace?: string
}

export interface IAnvilWorker {
    name: string,
    id: string
    status: string,
    jobs: IAnvilJob[]
}

export interface IAnvilJob {
    id: string,
    status: string,
    progress: number,
    identifier: string,
    config: any,
    workerId: string,
    workerName: string
}