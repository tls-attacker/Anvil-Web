<template>
    <h1>Tests</h1>
    <div id="command-bar">
        <input type="checkbox" @click="(e) => testRuns.forEach((r) => selectedRuns[r.Identifier] = (<HTMLInputElement>e.target).checked)"/>
        <input class="no-full-width" type="text" placeholder="Filter" v-model="filter"/>
        <a href="" role="button" class="negative" :disabled="Object.values(selectedRuns).includes(true)?undefined:''" @click.prevent="showDeleteDialog">Delete</a>
        <a href="" role="button" :disabled="Object.values(selectedRuns).includes(true)?undefined:''" @click.prevent="compare">Compare</a>
        <a href="" role="button" :disabled="Object.values(selectedRuns).includes(true)?undefined:''">Re-Run</a>
        <span style="flex: 1;"></span>
        <a href="" role="button" class="positive" @click.prevent="upload = true">Upload Test</a>
    </div>
    <span :class="{invisible: !Object.values(selectedRuns).includes(true)}">{{ Object.values(selectedRuns).reduce((p,c)=>{return c?p+1:p}, 0) }} selected</span>
    <div id="testrun-list">
        <article v-if="testRuns.every((v)=>!matchesFilter(v))">No test found matching the filter</article>
        <template v-for="(testRun, index) in testRuns" >
            <TestRunOverview :testRun="testRun" v-model:selected="selectedRuns[testRun.Identifier]" v-show="matchesFilter(testRun)"/>
        </template>
    </div>
    <UploadDialog :open="upload" @close="upload = false; refreshTestRuns()"/>
    <DeleteDialog v-if="deleteIdentifiers.length>0" @close="deleteIdentifiers = []; refreshTestRuns()" :identifiers="deleteIdentifiers"/>
</template>

<script lang="ts">
import type { ITestRun } from '@/lib/data_types';
import TestBar from '@/components/TestBar.vue'
import UploadDialog from '@/components/UploadDialog.vue';
import DeleteDialog from '@/components/DeleteDialog.vue';
import CircularProgress from '@/components/CircularProgress.vue';
import TestRunOverview from '@/components/TestRunOverview.vue';

export default {
    name: "Tests",
    components: { TestBar, UploadDialog, CircularProgress, TestRunOverview, DeleteDialog },
    data() {
        return {
            testRuns: [] as ITestRun[],
            selectedRuns: {} as {[identifier: string]: boolean},
            filter: "",
            upload: false,
            deleteIdentifiers: [] as string[],
            timer: 0
        }
    },
    methods: {
        refreshTestRuns() {
            //this.selectedRuns = {};
            //this.deleteIdentifiers = [];
            this.$api.getTestRuns().then((runs) => {
                this.testRuns = runs;
            });
        },
        matchesFilter(testRun: ITestRun): boolean {
            return testRun.Identifier.includes(this.filter)
        },
        compare() {
            this.$router.push(`/compare/${Object.keys(this.selectedRuns).filter((i,) => this.selectedRuns[i]).join("/")}`);
        },
        showDeleteDialog() {
            this.deleteIdentifiers = Object.keys(this.selectedRuns).filter((i,) => this.selectedRuns[i]);
        }
    },
    created() {
        this.timer = setInterval(() => this.refreshTestRuns(), 10000);
        this.refreshTestRuns();
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