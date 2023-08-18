<template>
    <template v-if="testRuns && Object.values(testRuns).length>0">
    <TestRunSummary :testMethod="(<ITestRun>Object.values(testRuns)[0]).TestMethod"/>
    <table role="grid">
        <thead>
            <th>Testcase</th>
            <th v-for="identifier in identifiers">
                <RouterLink :to="`/tests/${identifier}/${(<ITestRun>Object.values(testRuns)[0]).TestClass}/${(<ITestRun>Object.values(testRuns)[0]).TestMethod}`">{{ identifier.substring(0,8) }}</RouterLink>
            </th>
        </thead>
        <tbody>
            <tr>
                <td>Strictly Succeeded</td>
                <td v-for="identifier in identifiers">{{ testRuns[identifier].SucceededCases }}</td>
            </tr>
            <tr>
                <td>Conceptually Succeeded</td>
                <td v-for="identifier in identifiers">{{ testRuns[identifier].ConSucceededCases }}</td>
            </tr>
            <tr>
                <td>Fully Failed</td>
                <td v-for="identifier in identifiers">{{ testRuns[identifier].FailedCases }}</td>
            </tr>
            <tr>
                <td>Overall Result</td>
                <td v-for="identifier in identifiers">{{ getResultSymbol(testRuns[identifier].Result) }}</td>
            </tr>
            <tr class="header">
                <td :colspan="identifiers.length+1">States</td>
            </tr>
            <tr v-for="(derivation, uuid) in derivations">
                <td>{{ uuid }}</td>
                <td v-for="identifier in identifiers">
                    <span @click="openCase = testRuns[identifier].TestCases.find((c: ITestCase) => c.uuid == uuid)" class="pointer">
                        {{ getSymboldForUuid(testRuns[identifier], uuid as string) }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
<TestCaseModal :testCase="openCase" @close="openCase = undefined"/>
</template>

<script lang="ts">
import { type IScore, type ITestCase, type IReport, type ITestRun } from '@/lib/data_types'
import TestRunSummary from './TestRunSummary.vue'
import TestCaseModal from './TestCaseModal.vue';
import { getResultSymbol } from '@/composables/visuals';

export default {
    name: "CompareTableRuns",
    props: ["testRuns", "identifiers"],
    components: {TestRunSummary, TestCaseModal},
    data() {
        return {
            derivations: {} as {
                [uuid: string]: {
                    [identifier: string]: string;
                };
            },
            openCase: undefined as ITestCase | undefined
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
        getSymboldForUuid(testRun: ITestRun, uuid: string) {
            if (testRun.TestCases === undefined) {
                return "";
            }
            let result = testRun.TestCases.find((s) => s.uuid == uuid);
            if (result === undefined) {
                return "";
            }
            return this.getResultSymbol(result.Result);
        },
        getResultSymbol,
        mergeCases() {
            this.derivations = {};
            for (let testRun of Object.values(this.testRuns) as ITestRun[]) {
                for (let testCase of testRun.TestCases) {
                    if (!this.derivations[testCase.uuid]) {
                        this.derivations[testCase.uuid] = testCase.ParameterCombination;
                    }
                }
            }
        },
    },
    created() {
        this.mergeCases();
    },
    watch: {
        identifiers() {
            this.mergeCases();
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
</style>