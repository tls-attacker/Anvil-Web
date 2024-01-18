<template>
    <article>
            <header>
                <MethodFilter v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-results="filteredResults"/>
                <a href="" @click.prevent="changeOpen()"><template v-if="allOpen">collapse</template><template v-else>expand</template> all</a>
            </header>
            <main>
                <template v-for="prefix of [...prefixes, 'Hidden']">
                    <details v-show="filterPrefix(prefix)" :open="allOpen">
                        <summary>
                            <strong>{{ isNaN(parseInt(prefix)) ? prefix : "RFC " + prefix }}</strong>
                        </summary>
                        <table role="grid">
                            <tbody>
                                <template v-for="testRun in getTestrunsForPrefix(prefix)">
                                    <tr v-if="filterTestRun(testRun, prefix)">
                                        <td style="width: 2rem;">
                                            <input type="checkbox" :checked="hiddenTestIds.includes(testRun.TestId)" @click.prevent="switchHidden(testRun.TestId)">
                                        </td>
                                        <td>
                                            <details class="failed-reason" v-if="testRun.FailedReason">
                                                <summary>
                                                    <RouterLink :to="`/tests/${report.Identifier}/${testRun.TestId}`" class="contrast">
                                                        {{ testRun.TestId }}
                                                    </RouterLink>
                                                    &nbsp;
                                                    <small v-if="$api.getMetaData(testRun.TestId) && $api.getMetaData(testRun.TestId).tags">({{ $api.getMetaData(testRun.TestId).tags.join(", ") }})</small>
                                                </summary>
                                                <figure>
                                                    <code>{{ testRun.FailedReason }}</code>
                                                </figure>
                                            </details>
                                            <template v-else>
                                                <RouterLink :to="`/tests/${report.Identifier}/${testRun.TestId}`" class="contrast">
                                                    {{ testRun.TestId }}
                                                </RouterLink>
                                                &nbsp;
                                                <small v-if="$api.getMetaData(testRun.TestId) && $api.getMetaData(testRun.TestId).tags">({{ $api.getMetaData(testRun.TestId).tags.join(", ") }})</small>
                                            </template>
                                        </td>
                                        <td style="width: 5rem;">
                                            <span :data-tooltip="getResultToolTip(testRun)">
                                                {{ getResultDisplay(testRun) }}
                                            </span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </details>
                </template>
            </main>
        </article>
</template>

<script lang="ts">
import { getResultDisplay, getResultToolTip } from '@/composables/visuals';
import type { ITestRun } from '@/lib/data_types';
import MethodFilter from '@/components/MethodFilter.vue';

export default {
    name: "DetailedReportTable",
    components: { MethodFilter },
    props: ["report"],
    data() {
        return {
            filterText: "",
            filteredCategories: {} as {[category: string]: boolean},
            filteredResults: {} as {[result: string]: boolean},
            allOpen: false,
            prefixes: [] as string[],
            hiddenTestIds: [] as string[]
        }
    },
    methods: {
        filterPrefix(prefix: string) {
            if (prefix == "Hidden") return this.hiddenTestIds.length > 0;
            if (this.report == undefined) return false;
            if (this.report.TestRuns == undefined) return false;

            let results = this.report.TestRuns.filter((tR: ITestRun) => tR.TestId.startsWith(prefix));
            return results.some(this.filterTestRun);
        },
        getTestrunsForPrefix(prefix: string): ITestRun[] {
            if (prefix == "Hidden") {
                return this.report.TestRuns?.filter((tR: ITestRun) => this.hiddenTestIds.includes(tR.TestId));
            } else {
                return this.report.TestRuns?.filter((tR: ITestRun) => tR.TestId.startsWith(prefix));
            }
        },
        filterTestRun(testRun: ITestRun, prefix: string) {
            //if (testResult.Result == TestOutcome.DISABLED) return false;
            if (prefix != "Hidden" && this.hiddenTestIds.includes(testRun.TestId)) return false;
            if (this.filteredResults[testRun.Result] == false) return false;
            if (testRun.Score != undefined) {
                if (!Object.keys(testRun.Score).some((k) => this.filteredCategories[k])) return false;
            }
            let tags = [];
            if (this.$api.getMetaData(testRun.TestId) && this.$api.getMetaData(testRun.TestId).tags) {
                tags = this.$api.getMetaData(testRun.TestId).tags;
            }
            // filter exactly when wrapped in quotes
            if (this.filterText.startsWith('"') && this.filterText.endsWith('"')) {
                let text = this.filterText.substring(1, this.filterText.length-1);
                return tags.includes(text) || testRun.TestId == text;
            } else {
                let text = this.filterText.toLowerCase();
                let joinedTags = tags.join(" ").toLowerCase();
                return joinedTags.includes(text) || testRun.TestId.toLowerCase().includes(text);
            }
            
        },
        makePrefixes() {
            this.prefixes = [];
            if (this.report.TestRuns) {
                for (let tR of this.report.TestRuns) {
                    if (!this.prefixes.includes(tR.TestId.split("-")[0])) {
                        this.prefixes.push(tR.TestId.split("-")[0])
                    }
                }
            }
        },
        changeOpen() {
            this.allOpen = !this.allOpen;
            sessionStorage.setItem("reportTable_allOpen", JSON.stringify(this.allOpen)); 
        },
        switchHidden(testId: string) {
            if (this.hiddenTestIds.includes(testId)) {
                this.hiddenTestIds.splice(this.hiddenTestIds.indexOf(testId), 1)
            } else {
                this.hiddenTestIds.push(testId);
            }
            sessionStorage.setItem("reportTable_hiddenTestIds", JSON.stringify(this.hiddenTestIds));
        },
        getResultDisplay,
        getResultToolTip,
    },
    created() {
        this.makePrefixes();
        let cachedOpen = sessionStorage.getItem("reportTable_allOpen");
        if (cachedOpen != null) {
            this.allOpen = JSON.parse(cachedOpen);
        }
        let cachedHidden = sessionStorage.getItem("reportTable_hiddenTestIds");
        if (cachedHidden != null) {
            this.hiddenTestIds = JSON.parse(cachedHidden);
        }
    },
}
</script>

<style scoped>
details.failed-reason {
    margin-bottom: 0;
    padding-bottom: 0;
}
table {
    table-layout: fixed;
    width: 100%;
}
figure {
    margin-bottom: 0;
}
</style>