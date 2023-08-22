import type { IAnvilJob, IAnvilWorker, IReport, ITestRun } from './lib/data_types';

export module AnvilApi {
    const baseUrl = "http://localhost:5001/api/v2/";

    export function getIdentifiers(): Promise<string[]> {
        return getApiObject("reportIdentifiers");
    }

    export function getReports(identifiers?: string[], detailed?: boolean): Promise<IReport[]> {
        let query = detailed == undefined ? {identifiers: identifiers} : {identifiers: identifiers, detailed: ""+detailed}
        return getApiObject("report" + buildQueryString(query));
    }

    export function getReport(identifier: string): Promise<IReport> {
        return getApiObject("report/" + identifier);
    }

    export function deleteReport(identifier: string): Promise<{success: boolean}> {
        return new Promise((resolve, reject) => {
            fetch(baseUrl + "report/" + identifier, {method: "DELETE"})
            .then((response) => {
                if (!response.ok) {
                    reject(response);
                }
                resolve(response.json());
            })
        });
    }

    export function getTestRun(identifier: string, className: string, methodName: string): Promise<ITestRun> {
        return getApiObject(`report/${identifier}/testRuns/${className}/${methodName}`);
    }

    export function getTestRuns(identifiers: string[], className: string, methodName: string): Promise<{[identifier: string]: ITestRun}> {
        return getApiObject(`testRun/${className}/${methodName}` + buildQueryString({identifiers: identifiers}));
    }

    export function getWorkerList(): Promise<IAnvilWorker[]> {
        return getApiObject("control/worker");
    }

    export function getJobList(): Promise<IAnvilJob[]> {
        return getApiObject("control/job");
    }

    export function addJob(config: any, additionalConfig: any, workerId?: string): Promise<IAnvilJob> {
        let apiObject = workerId ? {config: config, additionalConfig: additionalConfig, workerId: workerId} : {config: config, additionalConfig: additionalConfig};
        return postApiObject("control/job", apiObject);
    }

    export function cancelJob(jobId: string): Promise<IAnvilJob> {
        return postApiObject(`control/job/${jobId}/cancel`, {});
    }

    export function shutdownWorker(workerId: string): Promise<IAnvilJob> {
        return postApiObject(`control/worker/${workerId}/shutdown`, {});
    }



    /* ---- Internal ---- */

    function getApiObject(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fetch(baseUrl + path)
            .then((response) => {
                if (!response.ok) {
                    reject(response);
                }
                resolve(response.json());
            })
            .catch(error => {
                console.error("Error while trying to access the api backend:");
                console.error(error);
                reject(error);
            });
        });
    }

    function postApiObject(path: string, requestObject: any): Promise<any> {
        return new Promise((resolve, reject) => {
            fetch(baseUrl + path, {
                method: "post",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestObject)
            })
            .then((response) => {
                if (!response.ok) {
                    reject(response);
                }
                resolve(response.json());
            })
            .catch(error => {
                console.error("Error while trying to access the api backend:");
                console.error(error);
                reject(error);
            });
        });
    }

    function buildQueryString(queryObject: {[name: string]: string | string[] | undefined}): string {
        let result = "";
        for (let key of Object.keys(queryObject)) {
            if (queryObject[key] !== undefined) {
                result += result === "" ? "?" : "&";
                if (typeof queryObject[key] === "string") {
                    result += key+"=";
                    result += queryObject[key];
                } else {
                    result += key+"[]=";
                    //@ts-ignore
                    result += queryObject[key].join("&"+key+"[]=");
                }
            }
        }
        return result;
    }

    export function formatDate(date: string): string {
        let d = new Date(date);
        return `${d.toLocaleDateString("de-DE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })} ${d.toLocaleTimeString("de-DE")}`
    }

    export function millisecondsToTime(time: number): string {
        let seconds = Math.floor(time/1000);
        if (seconds<60) {
            return `${seconds}s`
        } else {
            let min = Math.floor(seconds/60);
            seconds = Math.floor(seconds % 60)
            if (min<60) {
                return `${min}min ${seconds}s`
            } else {
                let hours = Math.floor(min/60);
                min = min % 60;
                return `${hours}h ${min}min`
            }
        }
    }

    let metaData = {} as {[key: string]: any};
    fetch("/src/assets/metadata.json").then(r => r.json()).then(o => metaData = o);
    export function getMetaData(testClass: string, testMethod: string): any {
        return metaData[testClass+"."+testMethod];
    }
}