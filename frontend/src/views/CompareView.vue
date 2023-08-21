<template>
    <hgroup>
        <h1>Comparing Results</h1>
        <h3>&lt; <RouterLink to="/" class="secondary">Tests</RouterLink>
            <template v-if="Object.values(testRuns).length > 0"> / <a class="secondary" href="" @click.prevent="$router.push({query: {}})">Compare Overview</a></template>
        </h3>
    </hgroup>
       
    <CompareTableReports v-show="Object.values(testRuns).length == 0" :reports="reports" :numReports="reports.length" />
    <CompareTableRuns :testRuns="testRuns" />
</template>

<script lang="ts">
import CompareTableReports from '@/components/CompareTableReports.vue'
import {type IReport, type ITestRun} from '@/lib/data_types'
import CompareTableRuns from '@/components/CompareTableRuns.vue';

export default {
    name: "CompareView",
    components: { CompareTableReports, CompareTableRuns },
    data() {
        return {
            reports: [] as IReport[],
            testRuns: {} as {[identifier: string]: ITestRun}
        }
    },
    methods: {
        fetchReports() {
            if (!this.$route.params["identifiers"]) {
                return;
            }
            let identifiers = this.$route.params["identifiers"]
            if (identifiers.length == 0) {
                return;
            }
            this.$api.getReports(identifiers as string[], true).then(response => {
                this.reports = response;
            });
        },
        fetchTestRuns() {
            if (!this.$route.params["identifiers"]) {
                return;
            }
            let identifiers = this.$route.params["identifiers"]
            if (identifiers.length == 0) {
                return;
            }
            if (this.$route.query["className"] && this.$route.query["methodName"]) {
                this.$api.getTestRuns(identifiers as string[], this.$route.query["className"] as string, this.$route.query["methodName"] as string)
                    .then((testRuns) => {
                        this.testRuns = testRuns;
                    });   
            } else {
                this.testRuns = {};
            }
        }
        
    },
    created() {
        this.fetchReports();
        this.fetchTestRuns();
    },
    watch: {
        '$route.query'(query) {
            this.fetchTestRuns();
        }
    }
}
</script>

<style scoped>

</style>