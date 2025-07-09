<template>
    <article>
            <header>
                Bla
            </header>
            <main>
                Blub
            </main>
        </article>
</template>

<script lang="ts">
import { getResultSymbolsTestRun, getResultToolTip } from '@/composables/visuals';
import type { ITestRun } from '@/lib/data_types';
import MethodFilter from '@/components/MethodFilter.vue';

export default {
    name: "SimpleReportTable",
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
            return testRun.TestMethod.toLowerCase().includes(this.filterText.toLowerCase()) || testRun.TestId.toLowerCase().includes(this.filterText.toLowerCase());
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
        getResultSymbolsTestRun,
        getResultToolTip,
    },
    created() {
        this.makePrefixes();
    },
}
</script>

<style scoped>
</style>