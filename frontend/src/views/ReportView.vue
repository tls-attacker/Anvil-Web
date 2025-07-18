<template>
    <div class="container">
        <article v-if="report === undefined" aria-busy="true"></article>
        <template v-else>
            <header class="flex-header">
                <hgroup>
                    <h1>{{ report.Identifier }}</h1>
                    <h2 v-if="!givenReport">&lt; <RouterLink to="/" class="secondary">Tests</RouterLink> / <strong>Report Overview</strong></h2>
                </hgroup>
                <template v-if="!givenReport">
                    <span class="spacer"></span>
                    <a v-if="report.Running && report.Job" role="button" href="" class="negative" @click.prevent="showCancel = true">Stop Run</a>
                    <a v-if="!report.Running" role="button" class="negative" href="" @click.prevent="showDelete = true">Delete</a>
                    <a v-if="!report.Running" role="button" href="" @click.prevent="showRerun = true">Re-Run</a>
                    <a v-if="!report.Running" role="button" :href="$api.getReportDownloadLink(report.Identifier)" :download="`report-${report.Identifier}.html`">Download</a>
                </template>
            </header>
            <article>
                <header class="report-summary">
                    <span><strong>Test started:</strong> {{ $api.formatDate(report.Date+"") }}</span>
                    <span><strong>Test Cases:</strong> {{ report.TestCaseCount }}</span>
                    <span><strong>Test Runs:</strong> {{ report.FinishedTests }}</span>
                    <span><strong>Elapsed Time:</strong> <template v-if="report.Running">{{ elapsedTime }}</template><template v-else>{{ $api.millisecondsToTime(report.ElapsedTime) }}</template></span>
                </header>
                <main>
                    <template v-if="!report.Running && report.Score && Object.keys(report.Score).length > 0">
                        <strong>Scores:</strong>
                        <div class="score-container">
                            <CircularProgress name="Security" :progress="report.Score['Security']"/>
                            <CircularProgress name="Crypto" :progress="report.Score['Crypto']"/>
                            <CircularProgress name="Interop." :progress="report.Score['Interoperability']"/>
                            <CircularProgress name="Certificate" :progress="report.Score['Certificate']"/>
                        </div>
                    </template>
                    <TestBar :failedTests="report.FullyFailedTests + report.PartiallyFailedTests" :disabledTests="report.DisabledTests"
                        :succeededTests="report.ConceptuallySucceededTests + report.StrictlySucceededTests" :errors="report.TestSuiteErrorTests"
                        clickable="true"/>
                    <div v-if="report.GuidelineReports && report.GuidelineReports.length>0" style="margin-top: 20px;">
                        <strong>Guidelines:</strong>
                        <div class="grid" style="margin-top: 10px;">
                            <div v-for="guideline of report.GuidelineReports" class="guideline-box" @click.prevent="showGuideline = guideline">
                                <div>
                                    <strong>{{ guideline.name }}</strong> <br>
                                    Adhered: {{ guideline.results.filter(g => g.adherence == "ADHERED").length }} <br>
                                    Violated: {{ guideline.results.filter(g => g.adherence == "VIOLATED").length }} <br>
                                    Check failed: {{ guideline.results.filter(g => g.adherence == "CHECK_FAILED").length }} <br>
                                </div>
                                <CircularProgress :progress="100*guideline.results.filter(g => g.adherence == 'ADHERED').length/guideline.results.filter(g => g.adherence == 'ADHERED' || g.adherence == 'VIOLATED').length"/>
                            </div>
                        </div>
                    </div>
                    <br>
                    <a v-if="report.TlsScannerReport" role="button" href="" @click.prevent="showTlsScanner = true">Show TLS Scanner Results</a>
                </main>
                <footer>
                    <progress v-if="report.Running"></progress>
                </footer>
            </article>

            <!-- <label><input type="checkbox" role="switch" v-model="detailedView"/> Detailed View</label> -->
            <DetailedReportTable :report="report" v-if="detailedView"/>
            <SimpleReportTable :report="report" v-else />

            <DeleteReportDialog v-if="showDelete" @close="showDelete = false" :identifiers="[report.Identifier]" @deleted="$router.push('/')"/>
            <CancelJobDialog v-if="showCancel" @close="showCancel = false" :job="report.Job" />
            <NewJobDialog v-if="showRerun" @close="showRerun = false" :givenConfig="report.AnvilConfig" :givenAdditionalConfig="report.AdditionalConfig"/>
            <GuidelineModal :guidelineReport="showGuideline" @close="showGuideline = undefined"/>
            <TlsScannerModal v-if="showTlsScanner" :scannerReport="report.TlsScannerReport" @close="showTlsScanner = false"/>
        </template>
    </div>
</template>

<script lang="ts">
import { type IGuidelineReport, type IReport, type ITestRun } from '@/lib/data_types';
import DeleteReportDialog from '@/components/DeleteReportDialog.vue'
import TestBar from '@/components/TestBar.vue';
import CircularProgress from '@/components/CircularProgress.vue';
import CancelJobDialog from '@/components/CancelJobDialog.vue';
import NewJobDialog from '@/components/NewJobDialog.vue';
import GuidelineModal from '@/components/GuidelineModal.vue';
import TlsScannerModal from '@/components/TlsScannerModal.vue';
import DetailedReportTable from '@/components/DetailedReportTable.vue';
import SimpleReportTable from '@/components/SimpleReportTable.vue';

export default {
    name: "ReportView",
    components: { TestBar, CircularProgress, DeleteReportDialog, CancelJobDialog, NewJobDialog, GuidelineModal, DetailedReportTable, SimpleReportTable, TlsScannerModal },
    props: ["givenReport"],
    data() {
        return {
            report: undefined as IReport | undefined,
            showDelete: false,
            showCancel: false,
            showRerun: false,
            timer: 0,
            showGuideline: undefined as IGuidelineReport | undefined,
            showTlsScanner: false,
            detailedView: true
        }
    },
    methods: {
        makeCategoryName(className: string): [string, string] {
            let parts = className.substring(31).split(".");
            let name = parts[parts.length-1];
            parts.splice(parts.length-1, 1);
            return [name, parts.join(", ")];
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
        }
    },
    created() {
        if (this.givenReport) {
            this.report = this.givenReport;
        } else {
            this.refreshReport();
        }
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
    text-align: right;
    padding-right: 50px;
}
td:first-child, th:first-child {
    text-align: start;
}

.guideline-box {
    background-color: rgb(240, 240, 240);
    border-radius: 10px;
    padding: 15px;
    display: flex;
    justify-content: space-between;
}

.guideline-box:hover {
    background-color: aliceblue;
    cursor: pointer;
}

</style>