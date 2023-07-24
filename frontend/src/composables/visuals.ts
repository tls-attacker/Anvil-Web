import type { ITestRun } from "@/lib/data_types";

export function getResultDisplay(testRun: ITestRun) {
    let resultSymbol = getResultSymbol(testRun.Result);
    if (testRun.HasVaryingAdditionalResultInformation) {
        resultSymbol += "⁉️";
    } else if (testRun.HasStateWithAdditionalResultInformation) {
        resultSymbol += "❗️";
    }
    return resultSymbol;
}

export function getResultToolTip(testRun: ITestRun) {
    let tooltip = `${testRun.CaseCount} cases`;
    if (testRun.FailedReason != null) {
        tooltip += "\n" + testRun.FailedReason;
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
        case "INCOMPLETE": return "📝";
        default: return result;
    }
}

export function formatEnum(upper: string): string {
    let parts = upper.split("_");
    return parts.map((p) => p[0]+p.substring(1).toLowerCase()).join(" ")
}