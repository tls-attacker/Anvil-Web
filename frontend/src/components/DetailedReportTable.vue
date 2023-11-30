<template>
    <article>
            <header>
                <MethodFilter v-model:filter-text="filterText" v-model:filtered-categories="filteredCategories" v-model:filtered-results="filteredResults"/>
                <a href="" @click.prevent="allOpen = !allOpen"><template v-if="allOpen">collapse</template><template v-else>expand</template> all</a>
            </header>
            <main>
                <template v-for="prefix of prefixes">
                    <details v-show="filterPrefix(prefix)" :open="allOpen">
                        <summary>
                            <strong>{{ prefix.startsWith("X") ? prefix : "RFC " + prefix }}</strong>
                        </summary>
                        <table role="grid">
                            <tbody>
                                <template v-for="testRun in report.TestRuns?.filter((tR: ITestRun) => tR.TestId.startsWith(prefix))">
                                    <tr v-if="filterTestRun(testRun)">
                                        <td>
                                            <RouterLink :to="`/tests/${report.Identifier}/${testRun.TestId}`" class="contrast">
                                                {{ testRun.TestId }}
                                            </RouterLink>
                                            &nbsp;
                                            <small>({{ $api.getMetaData(testRun.TestId).tags.join(", ") }})</small>
                                        </td>
                                        <td>
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
        }
    },
    methods: {
        filterPrefix(prefix: string) {
            if (this.report == undefined) return false;
            if (this.report.TestRuns == undefined) return false;

            let results = this.report.TestRuns.filter((tR: ITestRun) => tR.TestId.startsWith(prefix));
            return results.some(this.filterTestRun);
        },
        filterTestRun(testRun: ITestRun) {
            //if (testResult.Result == TestOutcome.DISABLED) return false;
            if (this.filteredResults[testRun.Result] == false) return false;
            if (testRun.Score != undefined) {
                if (!Object.keys(testRun.Score).some((k) => this.filteredCategories[k])) return false;
            }
            let tags = this.$api.getMetaData(testRun.TestId).tags.join(" ").toLowerCase();
            return tags.includes(this.filterText.toLowerCase()) || testRun.TestId.toLowerCase().includes(this.filterText.toLowerCase());
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
        getResultDisplay,
        getResultToolTip,
    },
    created() {
        this.makePrefixes();
    },
}
</script>

<style scoped>
</style>