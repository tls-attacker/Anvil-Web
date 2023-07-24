<template>
    <div>
        <MethodFilter v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-results="filteredResults" />
        <table v-if="reports.length > 0" role="grid">
            <thead>
                <th>Testcase</th>
                <th v-for="(report, index) in reports">
                    <RouterLink :to="`/tests/${report.Identifier}`">{{ report.Identifier.substring(0,8) }}</RouterLink>
                </th>
            </thead>
            <tbody>
                <tr v-for="score in Object.keys(reports[0].Score).sort()">
                    <td>Score {{ score }}</td>
                    <td v-for="report in reports">{{ formatScore(report.Score[score]) }}</td>
                </tr>
                <tr>
                    <td>Succeeded tests</td>
                    <td v-for="report in reports">{{ report.SucceededTests }}</td>
                </tr>
                <tr>
                    <td>Failed tests</td>
                    <td v-for="report in reports">{{ report.FailedTests }}</td>
                </tr>
                <tr>
                    <td>Disabled tests</td>
                    <td v-for="report in reports">{{ report.DisabledTests }}</td>
                </tr>
                <tr>
                    <td># TLS Handshakes</td>
                    <td v-for="report in reports">{{ report.StatesCount }}</td>
                </tr>
                <tr>
                    <td>Execution time</td>
                    <td v-for="report in reports">{{ formatTime(report.ElapsedTime/1000) }}</td>
                </tr>
                <template v-for="testClass in Object.keys(testClasses)">
                    <tr class="header">
                        <td :colspan="numReports+1">{{ testClass.substring(31) }}</td>
                    </tr>
                    <template v-for="testMethod in Object.keys(testClasses[testClass])">
                        <tr v-if="filterMethod(testClasses[testClass][testMethod])">
                            <td @click="showRun(testClass, testMethod)" class="pointer">{{ testMethod }}</td>
                            <td v-for="report in reports">
                                <span v-if="hasTestResultFor(report, testClass, testMethod)"
                                :data-tooltip="getResultToolTip(report.TestRuns[testClass][testMethod])"
                                @click="$router.push(`/tests/${report.Identifier}/${testClass}/${testMethod}`)"
                                class="pointer">
                                    {{ getResultDisplay(report.TestRuns[testClass][testMethod]) }}
                                </span>
                            </td>
                        </tr>
                    </template>
                </template>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { getResultDisplay, getResultToolTip } from '@/composables/visuals'
import { ScoreCategories, TestResult, type IScore, type ITestRun, type ITestMethod, type IReport } from '@/lib/data_types'
import MethodFilter from './MethodFilter.vue'
import TestResults from '@/views/TestResults.vue';

export default {
    name: "CompareTableReports",
    components: { MethodFilter },
    props: ["reports", "numReports"],
    emits: ["removeReport"],
    data() {
        return {
            testClasses: {} as {
                [testClass: string]: {[testMethod: string]: ITestMethod};
            },
            filterText: "",
            filteredCategories: [],
            filteredResults: []
        };
    },
    methods: {
        formatScore(score: IScore) {
            return `${score.Reached}/${score.Total} (${score.Percentage.toFixed(2)}%)`;
        },
        formatTime(seconds: number) {
            if (seconds < 60) {
                return `${seconds}s`;
            }
            else {
                let min = Math.floor(seconds / 60);
                seconds = Math.floor(seconds % 60);
                if (min < 60) {
                    return `${min}min ${seconds}s`;
                }
                else {
                    let hours = Math.floor(min / 60);
                    min = min % 60;
                    return `${hours}h ${min}min`;
                }
            }
        },
        hasTestResultFor(report: IReport, className: string, methodName: string) {
            return report.TestRuns !== undefined
                && report.TestRuns[className] !== undefined
                && report.TestRuns[className][methodName] !== undefined;
        },
        filterMethod(method: ITestMethod) {
            let relevantReports = this.reports.filter(r => this.hasTestResultFor(r, method.ClassName, method.MethodName));
            if (relevantReports.length==0) return false;
            if (!(<IReport[]>relevantReports).some((r => this.filteredResults[r.TestRuns[method.ClassName][method.MethodName].Result]))) return false;
            // TODO put categories in testmethod, better in metadata
            if (!(<IReport[]>relevantReports).some(r => {
                let score = r.TestRuns[method.ClassName][method.MethodName].Score;
                if (score != undefined) {
                    return Object.keys(score).some((k) => this.filteredCategories[k]);
                }
            })) return false;
            
            return method.MethodName.toLowerCase().includes(this.filterText.toLowerCase());
        },
        getResultDisplay,
        getResultToolTip,
        mergeTestClasses() {
            this.testClasses = {};
            for (let report of this.reports) {
                for (let testClass of Object.keys(report.TestRuns)) {
                    let testMethods = this.testClasses[testClass];
                    if (testMethods === undefined) {
                        this.testClasses[testClass] = {};
                        testMethods = this.testClasses[testClass];
                    }
                    for (let testMethod of Object.keys(report.TestRuns[testClass])) {
                        if (!Object.keys(testMethods).includes(testMethod) && report.TestRuns[testClass][testMethod].Result != "DISABLED") {
                            testMethods[testMethod] = report.TestRuns[testClass][testMethod].TestMethod;
                        }
                    }
                }
            }
            // console.log({...this.testClasses})
        },
        showRun(className: string, methodName: string) {
            this.$router.push({ query: { className: className, methodName: methodName } });
        },
        formatEnum(upper: string): string {
            let parts = upper.split("_");
            return parts.map((p) => p[0] + p.substring(1).toLowerCase()).join(" ");
        }
    },
    mounted() {
        this.mergeTestClasses();
    },
    watch: {
        numReports() {
            this.mergeTestClasses();
        }
    }
}
</script>

<style scoped>
    th, tr.header>td {
        font-weight: bold;
        background-color: rgb(209, 209, 209);
    }
    tr:hover {
        background-color: aliceblue;
    }
    td, th {
        text-align: center;
    }
    td:first-child, th:first-child {
        text-align: start;
    }
    .header + .header {
        display: none;
    }
</style>