<template>
    <article v-if="testRun === undefined" aria-busy="true"></article>
    <template v-else>
        <header class="flex-header">
            <hgroup>
                <h1>{{ testRun.Identifier }}</h1>
                <h2>&lt; <RouterLink to="/" class="secondary">Tests</RouterLink></h2>
            </hgroup>
            <span class="spacer"></span>
            <a v-if="testRun.Running" role="button" href="" class="negative" @click.prevent="showCancel = true">Stop Run</a>
            <a v-if="!testRun.Running" role="button" class="negative" href="" @click.prevent="showDelete = true">Delete</a>
            <a v-if="!testRun.Running" role="button" href="">Re-Run</a>
        </header>
        <article>
            <header class="test-summary">
                <span><strong>Test started:</strong> {{ $api.formatDate(testRun.Date+"") }}</span>
                <span><strong>States:</strong> {{ testRun.StatesCount }}</span>
                <span><strong>Elapsed Time:</strong> <template v-if="testRun.Running">{{ elapsedTime }}</template><template v-else>{{ $api.millisecondsToTime(testRun.ElapsedTime) }}</template></span>
            </header>
            <main>
                <template v-if="!testRun.Running">
                    <strong>Scores:</strong>
                    <div class="score-container">
                        <CircularProgress name="Security" :progress="testRun.Score.SECURITY.Percentage"/>
                        <CircularProgress name="Crypto" :progress="testRun.Score.CRYPTO.Percentage"/>
                        <CircularProgress name="Compliance" :progress="testRun.Score.COMPLIANCE.Percentage"/>
                        <CircularProgress name="Certificate" :progress="testRun.Score.CERTIFICATE.Percentage"/>
                    </div>
                </template>
                <TestBar :failedTests="testRun.FailedTests" :succeededTests="testRun.SucceededTests" :disabledTests="testRun.DisabledTests"/>
            </main>
            <footer>
                <progress v-if="testRun.Running"></progress>
            </footer>
        </article>
        <label><input type="checkbox" role="switch" checked /> Detailed View</label>
        <article>
            <header>
                <MethodFilter v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-outcomes="filteredOutcomes"/>
                <a href="" @click.prevent="allOpen = !allOpen"><template v-if="allOpen">collapse</template><template v-else>expand</template> all</a>
            </header>
            <main>
                <template v-for="(testResults, className) of testRun.TestResults">
                    <details v-show="filterClass(className as string)" :open="allOpen">
                        <summary>
                            <strong>{{ makeCategoryName(className as string)[0] }}</strong>
                            &nbsp;
                            <small>({{ makeCategoryName(className as string)[1] }})</small>
                        </summary>
                        <table role="grid">
                            <tbody>
                                <template v-for="testResult in testResults">
                                    <tr v-if="filterMethod(testResult)">
                                        <td>
                                            <RouterLink :to="`/tests/${testRun.Identifier}/${className}/${testResult.TestMethod.MethodName}`" class="contrast">
                                            {{ testResult.TestMethod.MethodName }}
                                            </RouterLink>
                                        </td>
                                        <td :data-tooltip="getResultToolTip(testResult)">
                                            {{ getResultDisplay(testResult) }}
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </details>
                </template>
            </main>
        </article>
        <DeleteTestDialog v-if="showDelete" @close="showDelete = false" :identifiers="[testRun.Identifier]" @deleted="$router.push('/')"/>
        <CancelJobDialog v-if="showCancel" @close="showCancel = false" :identifier="testRun.Identifier" />
    </template>
</template>

<script lang="ts">
import { TestOutcome, type ITestResult, type ITestRun, ScoreCategories } from '@/lib/data_types';
import TestRunOverview from '@/components/TestRunOverview.vue';
import DeleteTestDialog from '@/components/DeleteTestDialog.vue'
import TestBar from '@/components/TestBar.vue';
import CircularProgress from '@/components/CircularProgress.vue';
import { formatEnum, getResultDisplay, getResultToolTip } from '@/composables/visuals';
import MethodFilter from '@/components/MethodFilter.vue';
import CancelJobDialog from '@/components/CancelJobDialog.vue';

export default {
    name: "TestDetails",
    components: { TestRunOverview, TestBar, CircularProgress, MethodFilter, DeleteTestDialog, CancelJobDialog },
    data() {
        return {
            testRun: undefined as ITestRun | undefined,
            filterText: "",
            filteredCategories: {},
            filteredOutcomes: {},
            showDelete: false,
            allOpen: false,
            showCancel: false
        }
    },
    methods: {
        makeCategoryName(className: string): [string, string] {
            let parts = className.substring(31).split(".");
            let name = parts[parts.length-1];
            parts.splice(parts.length-1, 1);
            return [name, parts.join(", ")];
        },
        filterClass(className: string) {
            if (this.testRun == undefined) return false;
            if (this.testRun.TestResults == undefined) return false;

            let results = Object.values(this.testRun.TestResults[className]);
            return results.some(this.filterMethod);
        },
        filterMethod(testResult: ITestResult) {
            //if (testResult.Result == TestOutcome.DISABLED) return false;
            if (this.filteredOutcomes[testResult.Result] == false) return false;
            if (testResult.Score != undefined) {
                if (!Object.keys(testResult.Score).some((k) => this.filteredCategories[k])) return false;
            }
            return testResult.TestMethod.MethodName.toLowerCase().includes(this.filterText.toLowerCase());
        },
        getResultDisplay,
        getResultToolTip,
        formatEnum
    },
    created() {
        if (this.$route.params["identifier"]) {
            let identifier = this.$route.params["identifier"] as string
            this.$api.getTestRun(identifier).then((testRun: ITestRun) => {
                this.testRun = testRun;
                //this.testRun.Running = true;
            })
        }
    },
    computed: {
        startedTime() {
            if (!this.testRun) return 0;
            return new Date(this.testRun.Date+"").getTime();
        },
        elapsedTime() {
            if (!this.testRun) return null;
            return this.$api.millisecondsToTime(this.$time.value-this.startedTime);
        }
    }
}
</script>

<style scoped>
.test-summary {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 20px;
}
h1 {
    margin-bottom: 0;
}
.score-container {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    margin-top: 10px;
    justify-content: center;
}
td, th {
    text-align: center;
}
td:first-child, th:first-child {
    text-align: start;
}

</style>