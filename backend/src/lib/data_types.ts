interface ITimestamp {
    createdAt: Date,
    updatedAt: Date
}

export enum SeverityLevel {
    INFORMATIONAL = "INFORMATIONAL",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

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
    Running: boolean,
    ElapsedTime: number,
    PartiallyFailedTests: number,
    FullyFailedTests: number,
    StrictlySucceededTests: number,
    ConceptuallySucceededTests: number,
    DisabledTests: number,
    TotalTests: number,
    FinishedTests: number,
    TestCaseCount: number,
    Score: { [key: string]: number },
    TestEndpointType: string,
    TestRuns?: ITestRun[],
    Job?: IAnvilJob,
    AnvilConfig: string,
    AdditionalConfig: string,
    GuidelineReports?: IGuidelineReport[]
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
    TestMethod: string,
    TestClass: string,
    TestId: string,
    Result: TestResult,
    HasStateWithAdditionalResultInformation: boolean,
    HasVaryingAdditionalResultInformation: boolean,
    DisabledReason?: string,
    FailedReason?: string,
    ElapsedTime: number,
    TestCases: ITestCase[],
    CaseCount: number,
    SucceededCases: number,
    ConSucceededCases: number,
    FailedCases: number,
    Score: { [key: string]: number },
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
    ParameterCombination: { [identifier: string]: string | number | boolean }
    DisplayName: string
    Result: string
    AdditionalResultInformation: string[]
    AdditionalTestInformation: string[]
    SrcPort: number
    DstPort: number
    StartTimestamp: string
    EndTimestamp: string
    uuid: string
    Stacktrace?: string,
    PcapData: string
}

export interface IAnvilWorker {
    name: string,
    id: string,
    status: string,
    jobs: IAnvilJob[]
}

export interface IAnvilJob {
    id: string,
    status: string,
    progress: number,
    identifier: string,
    config: any,
    additionalConfig: any,
    workerId: string,
    workerName: string
}

export interface IGuideline {
    checkName: string,
    adherence: string,
    hint: string,
    info: string,
    [x: string]: unknown
}

export interface IGuidelineReport {
    name: string,
    link: string,
    results: IGuideline[]
}