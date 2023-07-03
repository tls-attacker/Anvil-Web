import type { ITestResult } from "@/lib/data_types";

export function getResultDisplay(testResult: ITestResult) {
    let resultSymbol = getResultSymbol(testResult.Result);
    if (testResult.HasVaryingAdditionalResultInformation) {
        resultSymbol += "⁉️";
    } else if (testResult.HasStateWithAdditionalResultInformation) {
        resultSymbol += "❗️";
    }
    return resultSymbol;
}

export function getResultToolTip(testResult: ITestResult) {
    let tooltip = `${testResult.StatesCount} states`;
    if (testResult.FailedReason != null) {
        tooltip += "\n" + testResult.FailedReason;
    }
    return tooltip;
}

export function getResultSymbol(result: string) {
    switch(result) {
        case "STRICTLY_SUCCEEDED": return "✅";
        case "CONCEPTUALLY_SUCCEEDED": return "⚠️✅";
        case "PARTIALLY_FAILED": return "⚠️❌";
        case "FULLY_FAILED": return "❌";
        case "DISABLED": return "";
        default: return result;
    }
}

export function formatEnum(upper: string): string {
    let parts = upper.split("_");
    return parts.map((p) => p[0]+p.substring(1).toLowerCase()).join(" ")
}