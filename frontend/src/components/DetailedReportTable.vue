<template>
    <article>
            <header>
                <MethodFilter
                    :categories="Object.keys(report.Score)"
                    v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-results="filteredResults"/>
                <a href="" @click.prevent="openAll()"><template v-if="allOpen">collapse</template><template v-else>expand</template> all</a>
                &nbsp; <a v-if="hiddenTestIds.length>0" @click.prevent="resetHidden()" href="">Reset hidden</a>
            </header>
            <main>
                <template v-for="prefix of Object.keys(prefixes)">
                    <details v-show="filterPrefix(prefix)" :open="prefixes[prefix]">
                        <summary @click.prevent="switchOpen(prefix)">
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
                                                    <small v-if="testRun.MetaData && testRun.MetaData.tags">({{ testRun.MetaData.tags.join(", ") }})</small>
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
                                                <small v-if="testRun.MetaData && testRun.MetaData.tags">({{ testRun.MetaData.tags.join(", ") }})</small>
                                            </template>
                                        </td>
                                        <td style="width: 6rem;">
                                            <span :data-tooltip="getResultToolTip(testRun)">
                                                {{ getResultSymbolsTestRun(testRun) }}
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
import { getResultSymbolsTestRun, getResultToolTip } from '@/composables/visuals';
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
            prefixes: {} as {[prefix: string]: boolean},
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
            if (testRun.Score != undefined && Object.keys(testRun.Score).length > 0) {
                if (!Object.keys(testRun.Score).some((k) => this.filteredCategories[k])) return false;
            }
            let tags = [];
            if (testRun.MetaData && testRun.MetaData.tags) {
                tags = testRun.MetaData.tags;
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
            let cachedPrefixString = sessionStorage.getItem("reportTable_prefixes");
            let cachedPrefixes = cachedPrefixString == null ? {} : JSON.parse(cachedPrefixString);
            this.prefixes = {"Hidden": "Hidden" in cachedPrefixes ? cachedPrefixes["Hidden"] : false};
            if (this.report.TestRuns) {
                for (let tR of this.report.TestRuns) {
                    let prefix = tR.TestId.split("-")[0];
                    if (!(prefix in this.prefixes)) {
                        this.prefixes[prefix] = prefix in cachedPrefixes ? cachedPrefixes[prefix] : false;
                    }
                }
            }
            this.allOpen = Object.values(this.prefixes).every(p => p);
        },
        openAll() {
            this.allOpen = !this.allOpen;
            for (let prefix in this.prefixes) {
                this.prefixes[prefix] = this.allOpen;
            }
            sessionStorage.setItem("reportTable_prefixes", JSON.stringify(this.prefixes));
        },
        switchOpen(prefix: string) {
            this.prefixes[prefix] = !this.prefixes[prefix];
            sessionStorage.setItem("reportTable_prefixes", JSON.stringify(this.prefixes));
        },
        switchHidden(testId: string) {
            if (this.hiddenTestIds.includes(testId)) {
                this.hiddenTestIds.splice(this.hiddenTestIds.indexOf(testId), 1)
            } else {
                this.hiddenTestIds.push(testId);
            }
            sessionStorage.setItem("reportTable_hiddenTestIds", JSON.stringify(this.hiddenTestIds));
        },
        resetHidden() {
            this.hiddenTestIds = [];
            sessionStorage.setItem("reportTable_hiddenTestIds", JSON.stringify(this.hiddenTestIds));
        },
        getResultSymbolsTestRun,
        getResultToolTip,
    },
    created() {
        this.makePrefixes();
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