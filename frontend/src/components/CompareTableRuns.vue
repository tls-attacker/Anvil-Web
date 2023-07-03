<template>
    <div>
        <MethodFilter v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-outcomes="filteredOutcomes" />
        <table v-if="testRuns.length > 0" role="grid">
            <thead>
                <th>Testcase</th>
                <th v-for="(testRun, index) in testRuns">
                    <RouterLink :to="`/tests/${testRun.Identifier}`">{{ testRun.Identifier.substring(0,8) }}</RouterLink>
                </th>
            </thead>
            <tbody>
                <tr v-for="score in Object.keys(testRuns[0].Score).sort()">
                    <td>Score {{ score }}</td>
                    <td v-for="testRun in testRuns">{{ formatScore(testRun.Score[score]) }}</td>
                </tr>
                <tr>
                    <td>Succeeded tests</td>
                    <td v-for="testRun in testRuns">{{ testRun.SucceededTests }}</td>
                </tr>
                <tr>
                    <td>Failed tests</td>
                    <td v-for="testRun in testRuns">{{ testRun.FailedTests }}</td>
                </tr>
                <tr>
                    <td>Disabled tests</td>
                    <td v-for="testRun in testRuns">{{ testRun.DisabledTests }}</td>
                </tr>
                <tr>
                    <td># TLS Handshakes</td>
                    <td v-for="testRun in testRuns">{{ testRun.StatesCount }}</td>
                </tr>
                <tr>
                    <td>Execution time</td>
                    <td v-for="testRun in testRuns">{{ formatTime(testRun.ElapsedTime/1000) }}</td>
                </tr>
                <template v-for="testClass in Object.keys(testClasses)">
                    <tr class="header">
                        <td :colspan="numReports+1">{{ testClass.substring(31) }}</td>
                    </tr>
                    <template v-for="testMethod in Object.keys(testClasses[testClass])">
                        <tr v-if="filterMethod(testClasses[testClass][testMethod])">
                            <td @click="showResults(testClass, testMethod)" class="pointer">{{ testMethod }}</td>
                            <td v-for="testRun in testRuns">
                                <span v-if="hasTestResultFor(testRun, testClass, testMethod)"
                                :data-tooltip="getResultToolTip(testRun.TestResults[testClass][testMethod])"
                                @click="$router.push(`/tests/${testRun.Identifier}/${testClass}/${testMethod}`)"
                                class="pointer">
                                    {{ getResultDisplay(testRun.TestResults[testClass][testMethod]) }}
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
import { ScoreCategories, TestOutcome, type IScore, type ITestResult, type ITestRun, type ITestMethod } from '@/lib/data_types'
import MethodFilter from './MethodFilter.vue'
import TestResults from '@/views/TestResults.vue';

export default {
    name: "CompareTableRuns",
    components: { MethodFilter },
    props: ["testRuns", "numReports"],
    emits: ["removeReport"],
    data() {
        return {
            testClasses: {} as {
                [testClass: string]: {[testMethod: string]: ITestMethod};
            },
            filterText: "",
            filteredCategories: [],
            filteredOutcomes: []
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
        hasTestResultFor(testRun: ITestRun, className: string, methodName: string) {
            return testRun.TestResults !== undefined
                && testRun.TestResults[className] !== undefined
                && testRun.TestResults[className][methodName] !== undefined;
        },
        filterMethod(method: ITestMethod) {
            if (!(<ITestRun[]>this.testRuns).some((tR => this.filteredOutcomes[tR.TestResults[method.ClassName][method.MethodName].Result]))) return false;
            // TODO put categories in testmethod, better in metadata
            if (!(<ITestRun[]>this.testRuns).some(tR => {
                let score = tR.TestResults[method.ClassName][method.MethodName].Score;
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
            for (let testRun of this.testRuns) {
                for (let testClass of Object.keys(testRun.TestResults)) {
                    let testMethods = this.testClasses[testClass];
                    if (testMethods === undefined) {
                        this.testClasses[testClass] = {};
                        testMethods = this.testClasses[testClass];
                    }
                    for (let testMethod of Object.keys(testRun.TestResults[testClass])) {
                        if (!Object.keys(testMethods).includes(testMethod) && testRun.TestResults[testClass][testMethod].Result != "DISABLED") {
                            testMethods[testMethod] = testRun.TestResults[testClass][testMethod].TestMethod;
                        }
                    }
                }
            }
            // console.log({...this.testClasses})
        },
        showResults(className: string, methodName: string) {
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