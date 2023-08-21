<template>
    <h1>Tests</h1>
    <div id="command-bar">
        <input type="checkbox" @click="(e) => reports.filter(matchesFilter).forEach((r) => selectedReports[r.Identifier] = (<HTMLInputElement>e.target).checked)"/>
        <input class="no-full-width" type="text" placeholder="Filter" v-model="filter"/>
        <a href="" role="button" class="negative" :disabled="Object.values(selectedReports).includes(true)?undefined:''" @click.prevent="showDeleteDialog">Delete</a>
        <a href="" role="button" :disabled="Object.values(selectedReports).includes(true)?undefined:''" @click.prevent="compare">Compare</a>
        <span style="flex: 1;"></span>
        <a href="" role="button" class="positive" @click.prevent="upload = true">Upload Test</a>
        <a href="" role="button" @click.prevent="newJob = true">Start Test</a>
    </div>
    <span :class="{invisible: !Object.values(selectedReports).includes(true)}">{{ Object.values(selectedReports).reduce((p,c)=>{return c?p+1:p}, 0) }} selected</span>
    <div id="testrun-list">
        <article v-if="reports.every((v)=>!matchesFilter(v))">No test found matching the filter</article>
        <template v-for="(report, index) in reports" >
            <ReportOverview :report="report" v-model:selected="selectedReports[report.Identifier]" v-show="matchesFilter(report)"/>
        </template>
    </div>
    <UploadDialog :open="upload" @close="upload = false; refreshReports()"/>
    <DeleteReportDialog v-if="deleteIdentifiers.length>0" @close="deleteIdentifiers = []" @deleted="deleteIdentifiers = []; refreshReports()" :identifiers="deleteIdentifiers"/>
    <NewJobDialog v-if="newJob" @close="newJob=false"/>
</template>

<script lang="ts">
import type { IReport, ITestRun } from '@/lib/data_types';
import TestBar from '@/components/TestBar.vue'
import UploadDialog from '@/components/UploadDialog.vue';
import DeleteReportDialog from '@/components/DeleteReportDialog.vue';
import CircularProgress from '@/components/CircularProgress.vue';
import ReportOverview from '@/components/ReportOverview.vue';
import NewJobDialog from '@/components/NewJobDialog.vue';

export default {
    name: "ReportList",
    components: { TestBar, UploadDialog, CircularProgress, ReportOverview, DeleteReportDialog, NewJobDialog },
    data() {
        return {
            reports: [] as IReport[],
            selectedReports: {} as {[identifier: string]: boolean},
            filter: "",
            upload: false,
            deleteIdentifiers: [] as string[],
            timer: 0,
            newJob: false
        }
    },
    methods: {
        refreshReports() {
            this.$api.getReports().then((runs) => {
                this.reports = runs;
            });
        },
        matchesFilter(report: IReport): boolean {
            return report.Identifier.includes(this.filter)
        },
        compare() {
            this.$router.push(`/compare/${Object.keys(this.selectedReports).filter((i,) => this.selectedReports[i]).join("/")}`);
        },
        showDeleteDialog() {
            this.deleteIdentifiers = Object.keys(this.selectedReports).filter((i,) => this.selectedReports[i]);
        },
        openRerun() {

        }
    },
    created() {
        this.timer = setInterval(() => this.refreshReports(), 10000);
        this.refreshReports();
    },
    unmounted() {
        clearInterval(this.timer);
    }
}
</script>

<style scoped>
#command-bar {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}
.invisible {
    visibility: hidden;
}
</style>