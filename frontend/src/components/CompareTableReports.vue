<template>
    <div>
        <MethodFilter
            v-if="reports.length > 0"
            :categories="Object.keys(reports[0].Score)"
            v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-results="filteredResults" />
        <table v-if="reports.length > 0" role="grid">
            <thead>
                <th>Identifier</th>
                <th v-for="(report, index) in reports">
                    <RouterLink :to="`/tests/${report.Identifier}`">{{ report.Identifier.substring(0,8) }}</RouterLink>
                </th>
            </thead>
            <tbody>
                <!--<tr v-for="score in Object.keys(reports[0].Score).sort()">
                    <td>Score {{ score }}</td>
                    <td v-for="report in reports">{{ formatScore(report.Score[score]) }}</td>
                </tr>-->
                <tr>
                    <td>Strictly succeeded tests</td>
                    <td v-for="report in reports">{{ report.StrictlySucceededTests }}</td>
                </tr>
                <tr>
                    <td>Conceptually succeeded tests</td>
                    <td v-for="report in reports">{{ report.ConceptuallySucceededTests }}</td>
                </tr>
                <tr>
                    <td>Fully failed tests</td>
                    <td v-for="report in reports">{{ report.FullyFailedTests }}</td>
                </tr>
                <tr>
                    <td>Partially failed tests</td>
                    <td v-for="report in reports">{{ report.PartiallyFailedTests }}</td>
                </tr>
                <tr>
                    <td>Disabled tests</td>
                    <td v-for="report in reports">{{ report.DisabledTests }}</td>
                </tr>
                <tr>
                    <td># Test Cases</td>
                    <td v-for="report in reports">{{ report.TestCaseCount }}</td>
                </tr>
                <tr>
                    <td>Execution time</td>
                    <td v-for="report in reports">{{ formatTime(report.ElapsedTime/1000) }}</td>
                </tr>
                <template v-for="prefix in Object.keys(prefixes)">
                    <tr class="header">
                        <td :colspan="numReports+1">{{ prefix.startsWith("X") ? prefix : "RFC " + prefix }}</td>
                    </tr>
                    <template v-for="testId in prefixes[prefix]">
                        <tr v-if="filterMethod(testId)">
                            <td @click="showRun(testId)" class="pointer">{{ testId }}</td>
                            <td v-for="report in reports">
                                <span v-if="hasTestResultFor(report, testId)"
                                :data-tooltip="getResultToolTip(report.TestRuns.find((tR: ITestRun) => tR.TestId == testId))"
                                @click="$router.push(`/tests/${report.Identifier}/${testId}`)"
                                class="pointer">
                                    {{ getResultDisplay(report.TestRuns.find((tR: ITestRun) => tR.TestId == testId)) }}
                                </span>
                            </td>
                        </tr>
                    </template>
                </template>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { getResultDisplay, getResultToolTip } from '@/composables/visuals'
import { type IReport, type ITestRun } from '@/lib/data_types'
import MethodFilter from './MethodFilter.vue'

export default {
    name: "CompareTableReports",
    components: { MethodFilter },
    props: ["reports", "numReports"],
    emits: ["removeReport"],
    data() {
        return {
            prefixes: {} as {[prefix: string]: string[]},
            filterText: "",
            filteredCategories: {} as {[category: string]: boolean},
            filteredResults: {} as {[result: string]: boolean}
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
        hasTestResultFor(report: IReport, testId: string) {
            return report.TestRuns !== undefined
                && report.TestRuns.find(tR => tR.TestId == testId);
        },
        filterMethod(testId: string) {
            let relevantReports: IReport[] = this.reports.filter((r: IReport) => this.hasTestResultFor(r, testId));
            if (relevantReports.length==0) return false;
            // @ts-ignore
            if (!relevantReports.some((r => this.filteredResults[r.TestRuns.find(tR => tR.TestId == testId).Result]))) return false;
            if (!relevantReports.some(r => {
                if (!r.TestRuns) return false;
                // @ts-ignore
                let score = r.TestRuns.find(tR => tR.TestId == testId).Score;
                if (score != undefined) {
                    return Object.keys(score).some((k) => this.filteredCategories[k]);
                } else {
                    return true;
                }
            })) return false;
            let tags = [];
            let testRun = this.reports[0].TestRuns.find((tR: ITestRun) => tR.TestId == testId)
            if (testRun.MetaData && testRun.MetaData.tags) {
                tags = testRun.MetaData.tags;
            }
            // filter exactly when wrapped in quotes
            if (this.filterText.startsWith('"') && this.filterText.endsWith('"')) {
                let text = this.filterText.substring(1, this.filterText.length-1);
                return tags.includes(text) || testId == text;
            } else {
                let text = this.filterText.toLowerCase();
                let joinedTags = tags.join(" ").toLowerCase();
                return joinedTags.includes(text) || testId.toLowerCase().includes(text);
            }
        },
        getResultDisplay,
        getResultToolTip,
        makePrefixes() {
            this.prefixes = {};
            for (let report of this.reports) {
                for (let tR of report.TestRuns) {
                    let prefix = this.prefixes[tR.TestId.split("-")[0]];
                    if (!prefix) {
                        this.prefixes[tR.TestId.split("-")[0]] = [];
                        prefix = this.prefixes[tR.TestId.split("-")[0]];
                    }
                    if (!prefix.includes(tR.TestId)) {
                        prefix.push(tR.TestId);
                    }
                }
            }
        },
        showRun(testId: string) {
            this.$router.push({ query: { testId: testId } });
        },
        formatEnum(upper: string): string {
            let parts = upper.split("_");
            return parts.map((p) => p[0] + p.substring(1).toLowerCase()).join(" ");
        }
    },
    mounted() {
        this.makePrefixes();
    },
    watch: {
        numReports() {
            this.makePrefixes();
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
    .header + .header {
        display: none;
    }
</style>