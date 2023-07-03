<template>
    <template v-if="testResults && testResults.length>0">
    <TestResultSummary :testMethod="testResults[0].TestMethod"/>
    <table role="grid">
        <thead>
            <th>Testcase</th>
            <th v-for="identifier in identifiers">
                <RouterLink :to="`/tests/${identifier}/${testResults[0].TestMethod.ClassName}/${testResults[0].TestMethod.MethodName}`">{{ identifier.substring(0,8) }}</RouterLink>
            </th>
        </thead>
        <tbody>
            <tr>
                <td>Strictly Succeeded</td>
                <td v-for="testResult in testResults">{{ testResult.SucceededStates }}</td>
            </tr>
            <tr>
                <td>Conceptually Succeeded</td>
                <td v-for="testResult in testResults">{{ testResult.ConSucceededStates }}</td>
            </tr>
            <tr>
                <td>Fully Failed</td>
                <td v-for="testResult in testResults">{{ testResult.FailedStates }}</td>
            </tr>
            <tr>
                <td>Overall Result</td>
                <td v-for="testResult in testResults">{{ getResultSymbol(testResult.Result) }}</td>
            </tr>
            <tr class="header">
                <td :colspan="identifiers.length+1">States</td>
            </tr>
            <tr v-for="(derivation, uuid) in derivations">
                <td>{{ uuid }}</td>
                <td v-for="testResult in testResults">
                    <span @click="openState = testResult.States.find(s => s.uuid == uuid)" class="pointer">
                        {{ getSymboldForUuid(testResult, uuid as string) }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
<StateModal :state="openState" @close="openState = undefined"/>
</template>

<script lang="ts">
import { type IScore, type IState, type ITestResult, type ITestRun } from '@/lib/data_types'
import TestResultSummary from './TestResultSummary.vue'
import StateModal from './StateModal.vue';
import { getResultSymbol } from '@/composables/visuals';

export default {
    name: "CompareTestResults",
    props: ["testResults", "identifiers"],
    components: {TestResultSummary, StateModal},
    data() {
        return {
            derivations: {} as {
                [uuid: string]: {
                    [identifier: string]: string;
                };
            },
            openState: undefined as IState | undefined
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
        getSymboldForUuid(testResult: ITestResult, uuid: string) {
            if (testResult.States === undefined) {
                return "";
            }
            let result = testResult.States.find((s) => s.uuid == uuid);
            if (result === undefined) {
                return "";
            }
            return this.getResultSymbol(result.Result);
        },
        getResultSymbol,
        mergeStates() {
            this.derivations = {};
            for (let testResult of this.testResults as ITestResult[]) {
                for (let state of testResult.States) {
                    if (!this.derivations[state.uuid]) {
                        this.derivations[state.uuid] = state.DerivationContainer;
                    }
                }
            }
        },
    },
    created() {
        this.mergeStates();
    },
    watch: {
        identifiers() {
            this.mergeStates();
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