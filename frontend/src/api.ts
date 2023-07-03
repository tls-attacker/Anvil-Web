import type { IAnvilWorker, ITestResult, ITestRun } from './lib/data_types';

export module AnvilApi {
    const baseUrl = "http://localhost:5001/api/v2/";

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

    export function getIdentifiers(): Promise<string[]> {
        return getApiObject("testRunIdentifiers");
    }

    export function getTestRuns(identifiers?: string[], detailed?: boolean): Promise<ITestRun[]> {
        return getApiObject("testRuns" + buildQueryString({identifiers: identifiers, detailed: detailed+""}));
    }

    export function getTestRun(identifier: string): Promise<ITestRun> {
        return getApiObject("testRuns/" + identifier);
    }

    export function deleteTestRun(identifier: string): Promise<{success: boolean}> {
        return new Promise((resolve, reject) => {
            fetch(baseUrl + "testRuns/" + identifier, {method: "DELETE"})
            .then((response) => {
                if (!response.ok) {
                    reject(response);
                }
                resolve(response.json());
            })
        });
    }

    export function getTestResult(identifier: string, className: string, methodName: string): Promise<ITestResult> {
        return getApiObject(`testRuns/${identifier}/testResults/${className}/${methodName}`);
    }

    export function getTestResults(identifiers: string[], className: string, methodName: string): Promise<ITestResult[]> {
        return getApiObject(`testResult/${className}/${methodName}` + buildQueryString({identifiers: identifiers}));
    }

    export function getWorkerList(): Promise<IAnvilWorker[]> {
        return getApiObject("/control/worker");
    }



    /* ---- Internal ---- */


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
        let seconds = time/1000;
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
}