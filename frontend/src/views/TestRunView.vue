<template>
    <article v-if="testRun === undefined" aria-busy="true"></article>
    <template v-else>
        <header class="flex-header">
            <hgroup>
                <h1>{{ testRun.TestMethod.MethodName }}</h1>
                <h3>&lt; <RouterLink to="/" class="secondary">Tests</RouterLink> / <RouterLink :to="`/tests/${identifier}`" class="secondary">{{ identifier }}</RouterLink></h3>
            </hgroup>
            <span class="spacer"></span>
            <a role="button" href="">Re-Run</a>
        </header>
        <TestRunSummary :testMethod="testRun.TestMethod" :testRun="testRun"/>

        <article>
            <header class="grid">
                <label><input type="checkbox" v-model="filter.succeeded"/>Succeeded</label>
                <label><input type="checkbox" v-model="filter.conSucceeded"/>Conceptually Succeeded</label>
                <label><input type="checkbox" v-model="filter.failed"/>Failed</label>
            </header>
            <figure v-if="testRun.TestCases.length>0">
                <table role="grid">
                <thead>
                    <tr>
                        <th v-for="(derivation, parameter) of testRun.TestCases[0].DerivationContainer">{{ parameter }}</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="testCase of testRun.TestCases">
                        <tr v-if="filterCase(testCase)" @click="openCase = testCase">
                            <td v-for="(derivation, parameter) of testCase.DerivationContainer">{{ derivation }}</td>
                            <td>{{ getResultSymbol(testCase.Result) }}</td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </figure>
        </article>

        <TestCaseModal :case="openCase" @close="openCase = undefined"/>
    </template>
</template>

<script lang="ts">
import { TestResult, type ITestCase, type ITestRun } from '@/lib/data_types';
import CircularProgress from '@/components/CircularProgress.vue';
import TestCaseModal from '@/components/TestCaseModal.vue';
import TestRunSummary from '@/components/TestRunSummary.vue';
import { getResultSymbol } from '@/composables/visuals';

export default {
    name: "TestRunView",
    components: { CircularProgress, TestCaseModal, TestRunSummary },
    data() {
        return {
            testRun: undefined as ITestRun | undefined,
            identifier: "",
            openCase: undefined as ITestCase | undefined,
            filter: {
                succeeded: true,
                conSucceeded: true,
                failed: true
            }
        };
    },
    created() {
        if (this.$route.params["identifier"] && this.$route.params["className"] && this.$route.params["methodName"]) {
            let identifier = this.$route.params["identifier"] as string;
            let className = this.$route.params["className"] as string;
            let methodName = this.$route.params["methodName"] as string;
            this.$api.getTestRun(identifier, className, methodName).then((testRun: ITestRun) => {
                this.testRun = testRun;
                this.identifier = identifier;
            });
        }
    },
    methods: {
        getResultSymbol,
        filterCase(testCase: ITestCase): boolean {
            if (testCase.Result == TestResult.STRICTLY_SUCCEEDED) {
                return this.filter.succeeded;
            } else if (testCase.Result == TestResult.CONCEPTUALLY_SUCCEEDED) {
                return this.filter.conSucceeded;
            } else if (testCase.Result == TestResult.FULLY_FAILED) {
                return this.filter.failed;
            } else {
                return true;
            }
        }
    }
}
</script>

<style scoped>
tbody > tr:hover {
    cursor: pointer;
    --table-row-stripped-background-color: rgb(227, 227, 227);
    background-color: rgb(227, 227, 227);
}
hgroup {
    max-width: 80%;
}
h1 {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}
.testrun-summary {
    display: flex;
    flex-direction: column;
}
.summary-main-flex {
    display: flex;
    justify-content: space-between;
}
</style>