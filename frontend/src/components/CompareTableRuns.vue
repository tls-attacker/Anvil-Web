<template>
    <template v-if="testRuns && Object.values(testRuns).length>0">
    <TestRunSummary :testId="$route.query.testId" :metaData="(Object.values(testRuns)[0] as ITestRun).MetaData"/>
    <table role="grid">
        <thead>
            <th>Identifier</th>
            <th v-for="identifier in Object.keys(testRuns)">
                <RouterLink :to="`/tests/${identifier}/${$route.query.testId}`">{{ identifier.substring(0,8) }}</RouterLink>
            </th>
        </thead>
        <tbody>
            <tr>
                <td>Strictly Succeeded</td>
                <td v-for="identifier in Object.keys(testRuns)">{{ testRuns[identifier].SucceededCases }}</td>
            </tr>
            <tr>
                <td>Conceptually Succeeded</td>
                <td v-for="identifier in Object.keys(testRuns)">{{ testRuns[identifier].ConSucceededCases }}</td>
            </tr>
            <tr>
                <td>Fully Failed</td>
                <td v-for="identifier in Object.keys(testRuns)">{{ testRuns[identifier].FailedCases }}</td>
            </tr>
            <tr>
                <td>Overall Result</td>
                <td v-for="identifier in Object.keys(testRuns)">{{ getResultSymbolsTestRun(testRuns[identifier]) }}</td>
            </tr>
            <tr class="header" v-if="Object.keys(derivations).length > 0">
                <td :colspan="Object.keys(testRuns).length+1">Test Cases</td>
            </tr>
            <tr v-for="(derivation, uuid) in derivations">
                <td>{{ (uuid as string).substring(0, 16) }}</td>
                <td v-for="identifier in Object.keys(testRuns)">
                    <span @click="openCase = testRuns[identifier].TestCases.find((c: ITestCase) => c.uuid == uuid); selectedIdentifier = identifier" class="pointer">
                        {{ getSymboldForUuid(testRuns[identifier], uuid as string) }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
<TestCaseModal :testCase="openCase" @close="openCase = undefined" :testId="$route.query.testId" :identifier="selectedIdentifier"/>
</template>

<script lang="ts">
import { type ITestCase, type ITestRun } from '@/lib/data_types'
import TestRunSummary from './TestRunSummary.vue'
import TestCaseModal from './TestCaseModal.vue';
import { getResultSymbolsTestRun, getResultSymbolsTestCase } from '@/composables/visuals';

export default {
    name: "CompareTableRuns",
    props: ["testRuns"],
    components: {TestRunSummary, TestCaseModal},
    data() {
        return {
            derivations: {} as {
                [uuid: string]: {
                    [identifier: string]: string | number | boolean;
                };
            },
            openCase: undefined as ITestCase | undefined,
            selectedIdentifier: ""
        };
    },
    methods: {
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
            return this.getResultSymbolsTestCase(result);
        },
        getResultSymbolsTestRun,
        getResultSymbolsTestCase,
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
        testRuns() {
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