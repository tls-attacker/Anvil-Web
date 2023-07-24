<template>
    <article v-if="report === undefined" aria-busy="true"></article>
    <template v-else>
        <header class="flex-header">
            <hgroup>
                <h1>{{ report.Identifier }}</h1>
                <h2>&lt; <RouterLink to="/" class="secondary">Tests</RouterLink></h2>
            </hgroup>
            <span class="spacer"></span>
            <a v-if="report.Running" role="button" href="" class="negative" @click.prevent="showCancel = true">Stop Run</a>
            <a v-if="!report.Running" role="button" class="negative" href="" @click.prevent="showDelete = true">Delete</a>
            <a v-if="!report.Running" role="button" href="" @click.prevent="showRerun = true">Re-Run</a>
        </header>
        <article>
            <header class="report-summary">
                <span><strong>Test started:</strong> {{ $api.formatDate(report.Date+"") }}</span>
                <span><strong>States:</strong> {{ report.StatesCount }}</span>
                <span><strong>Elapsed Time:</strong> <template v-if="report.Running">{{ elapsedTime }}</template><template v-else>{{ $api.millisecondsToTime(report.ElapsedTime) }}</template></span>
            </header>
            <main>
                <template v-if="!report.Running">
                    <strong>Scores:</strong>
                    <div class="score-container">
                        <CircularProgress name="Security" :progress="report.Score.SECURITY.Percentage"/>
                        <CircularProgress name="Crypto" :progress="report.Score.CRYPTO.Percentage"/>
                        <CircularProgress name="Compliance" :progress="report.Score.COMPLIANCE.Percentage"/>
                        <CircularProgress name="Certificate" :progress="report.Score.CERTIFICATE.Percentage"/>
                    </div>
                </template>
                <TestBar :failedTests="report.FailedTests" :succeededTests="report.SucceededTests" :disabledTests="report.DisabledTests"/>
            </main>
            <footer>
                <progress v-if="report.Running"></progress>
            </footer>
        </article>
        <label><input type="checkbox" role="switch" checked /> Detailed View</label>
        <article>
            <header>
                <MethodFilter v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-results="filteredResults"/>
                <a href="" @click.prevent="allOpen = !allOpen"><template v-if="allOpen">collapse</template><template v-else>expand</template> all</a>
            </header>
            <main>
                <template v-for="(testRuns, className) of report.TestRuns">
                    <details v-show="filterClass(className as string)" :open="allOpen">
                        <summary>
                            <strong>{{ makeCategoryName(className as string)[0] }}</strong>
                            &nbsp;
                            <small>({{ makeCategoryName(className as string)[1] }})</small>
                        </summary>
                        <table role="grid">
                            <tbody>
                                <template v-for="testRun in testRuns">
                                    <tr v-if="filterMethod(testRun)">
                                        <td>
                                            <RouterLink :to="`/tests/${report.Identifier}/${className}/${testRun.TestMethod.MethodName}`" class="contrast">
                                            {{ testRun.TestMethod.MethodName }}
                                            </RouterLink>
                                        </td>
                                        <td :data-tooltip="getResultToolTip(testRun)">
                                            {{ getResultDisplay(testRun) }}
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </details>
                </template>
            </main>
        </article>
        <DeleteReportDialog v-if="showDelete" @close="showDelete = false" :identifiers="[report.Identifier]" @deleted="$router.push('/')"/>
        <CancelJobDialog v-if="showCancel" @close="showCancel = false" :job="report.Job" />
        <NewJobDialog v-if="showRerun" @close="showRerun = false" :givenConfig="report.Config"/>
    </template>
</template>

<script lang="ts">
import { type IReport, type ITestRun } from '@/lib/data_types';
import DeleteReportDialog from '@/components/DeleteReportDialog.vue'
import TestBar from '@/components/TestBar.vue';
import CircularProgress from '@/components/CircularProgress.vue';
import { formatEnum, getResultDisplay, getResultToolTip } from '@/composables/visuals';
import MethodFilter from '@/components/MethodFilter.vue';
import CancelJobDialog from '@/components/CancelJobDialog.vue';
import NewJobDialog from '@/components/NewJobDialog.vue';

export default {
    name: "ReportView",
    components: { TestBar, CircularProgress, MethodFilter, DeleteReportDialog, CancelJobDialog, NewJobDialog },
    data() {
        return {
            report: undefined as IReport | undefined,
            filterText: "",
            filteredCategories: {},
            filteredResults: {},
            showDelete: false,
            allOpen: false,
            showCancel: false,
            showRerun: false,
            timer: 0
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
            if (this.report == undefined) return false;
            if (this.report.TestRuns == undefined) return false;

            let results = Object.values(this.report.TestRuns[className]);
            return results.some(this.filterMethod);
        },
        filterMethod(testRun: ITestRun) {
            //if (testResult.Result == TestOutcome.DISABLED) return false;
            if (this.filteredResults[testRun.Result] == false) return false;
            if (testRun.Score != undefined) {
                if (!Object.keys(testRun.Score).some((k) => this.filteredCategories[k])) return false;
            }
            return testRun.TestMethod.MethodName.toLowerCase().includes(this.filterText.toLowerCase());
        },
        refreshReport() {
            if (this.$route.params["identifier"]) {
                let identifier = this.$route.params["identifier"] as string
                this.$api.getReport(identifier).then((report: IReport) => {
                    this.report = report;
                    if (report.Running) {
                        this.timer = setTimeout(() => this.refreshReport(), 10000);
                    }
                })
            }
        },
        getResultDisplay,
        getResultToolTip,
        formatEnum
    },
    created() {
        this.refreshReport();
    },
    unmounted() {
        clearTimeout(this.timer);
    },
    computed: {
        startedTime() {
            if (!this.report) return 0;
            return new Date(this.report.Date+"").getTime();
        },
        elapsedTime() {
            if (!this.report) return null;
            return this.$api.millisecondsToTime(this.$time.value-this.startedTime);
        }
    }
}
</script>

<style scoped>
.report-summary {
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