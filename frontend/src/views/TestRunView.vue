<template>
    <article v-if="testRun === undefined" aria-busy="true"></article>
    <template v-else>
        <header class="flex-header">
            <hgroup>
                <h1>{{ testRun.TestId }}</h1>
                <h3>&lt; <RouterLink to="/" class="secondary">Tests</RouterLink> / <RouterLink :to="`/tests/${identifier}`" class="secondary">{{ identifier }}</RouterLink></h3>
            </hgroup>
            <span class="spacer"></span>
            <a role="button" href="">Re-Run</a>
        </header>
        <TestRunSummary :testId="testRun.TestId" :testRun="testRun"/>

        <article v-if="testRun.CaseCount>0">
            <header>
                <details style="margin-bottom: var(--spacing);" open>
                    <summary role="button">Result:</summary>
                    <div class="grid details-container">
                        <label><input type="checkbox" v-model="filter.succeeded"/>Succeeded</label>
                        <label><input type="checkbox" v-model="filter.conSucceeded"/>Conceptually Succeeded</label>
                        <label><input type="checkbox" v-model="filter.failed"/>Failed</label>
                    </div>
                </details>
                <details open>
                    <summary role="button">Hidden Parameters</summary>
                    <PillContainer :pills="allParameters.filter(p => !selectedParameters.includes(p))" @click="addParameter" class="details-container"/>
                </details>
            </header>
            <figure v-if="allParameters.length>0">
                <table role="grid">
                    <colgroup>
                        <col v-for="parameter in selectedParameters" span="1">
                    </colgroup>
                    <thead>
                        <tr>
                            <th v-for="parameter of selectedParameters">
                                <span class="parameter-header"
                                    @click.prevent="selectedParameters.splice(selectedParameters.indexOf(parameter), 1)">
                                    {{parameter.replace("INCLUDE_", "")}}
                                </span>
                                <span @click.prevent="sortByParameter(parameter)" :class="{'sorting-symbol': true, 'selected': parameter==sortedBy, 'rotated': parameter==sortedBy && !sortedAsc}">▼</span>
                            </th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="testCase of testRun.TestCases">
                            <tr v-if="filterCase(testCase)" @click="openCase = testCase">
                                <td v-for="parameter of selectedParameters" :class="{'right-align': isRightAlign(testCase.ParameterCombination[parameter])}">{{ testCase.ParameterCombination[parameter] }}</td>
                                <td>{{ getResultSymbol(testCase.Result) }}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </figure>
        </article>

        <TestCaseModal :testCase="openCase" @close="openCase = undefined"/>
    </template>
</template>

<script lang="ts">
import { TestResult, type ITestCase, type ITestRun } from '@/lib/data_types';
import CircularProgress from '@/components/CircularProgress.vue';
import TestCaseModal from '@/components/TestCaseModal.vue';
import TestRunSummary from '@/components/TestRunSummary.vue';
import { getResultSymbol } from '@/composables/visuals';
import PillContainer from '@/components/PillContainer.vue';

export default {
    name: "TestRunView",
    components: { CircularProgress, TestCaseModal, TestRunSummary, PillContainer },
    data() {
        return {
            testRun: undefined as ITestRun | undefined,
            identifier: "",
            openCase: undefined as ITestCase | undefined,
            filter: {
                succeeded: true,
                conSucceeded: true,
                failed: true
            },
            allParameters: [] as string[],
            selectedParameters: [] as string[],
            sortedBy: "",
            sortedAsc: true
        };
    },
    created() {
        if (this.$route.params["identifier"] && this.$route.params["testId"]) {
            let identifier = this.$route.params["identifier"] as string;
            let testId = this.$route.params["testId"] as string;
            this.$api.getTestRun(identifier, testId).then((testRun: ITestRun) => {
                this.testRun = testRun;
                this.identifier = identifier;
                if (testRun.TestCases.length > 0) {
                    this.allParameters = Object.keys(testRun.TestCases[0].ParameterCombination);
                    for (let parameter of this.allParameters) {
                        let firstValue = testRun.TestCases[0].ParameterCombination[parameter];
                        if (testRun.TestCases.some(c => c.ParameterCombination[parameter] != firstValue)) {
                            this.selectedParameters.push(parameter);
                        }
                    }
                    this.selectedParameters.sort();
                }
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
        },
        addParameter(parameter: string) {
            this.selectedParameters.push(parameter);
            this.selectedParameters.sort();
        },
        sortByParameter(parameter: string) {
            if (this.sortedBy == parameter) {
                this.sortedAsc = !this.sortedAsc;
            } else {
                this.sortedAsc = true;
            }
            this.sortedBy = parameter;
            this.testRun?.TestCases.sort((caseA, caseB) => {
                let cA = this.sortedAsc ? caseA : caseB;
                let cB = this.sortedAsc ? caseB : caseA;
                if (typeof(cA.ParameterCombination[parameter]) === "number") {
                    // @ts-ignore
                    return cA.ParameterCombination[parameter] - cB.ParameterCombination[parameter];
                } else {
                    return (""+cA.ParameterCombination[parameter]).localeCompare(""+cB.ParameterCombination[parameter])
                }
            })
        },
        isRightAlign(parameter: any): boolean {
            return typeof(parameter) === "number";
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
.parameter-header { 
    display: inline-block;  
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}
.parameter-header:hover {
    /* overflow: visible; */
    text-decoration: line-through;
}
th {
    font-weight: bold;
    background-color: rgb(209, 209, 209);
    max-width: 210px;
    white-space: nowrap;
}
.sorting-symbol {
    display: inline-block;
    visibility: hidden;
    margin-left: 5px;
    cursor: pointer;
    overflow: hidden;
}
.sorting-symbol.selected {
    visibility: visible;
}
.sorting-symbol.selected.rotated {
    transform: rotate(180deg);
}
th:hover > .sorting-symbol {
    visibility: visible;
}
.right-align {
    text-align: right;
}

details {
    margin-bottom: 0;
    padding-bottom: 0;
}
</style>