<template>
    <hgroup>
        <h1>Comparing Results</h1>
        <h3>&lt; <RouterLink to="/" class="secondary">Tests</RouterLink>
            <template v-if="testResults.length > 0"> / <a class="secondary" href="" @click.prevent="$router.push({query: {}})">Compare Overview</a></template>
        </h3>
    </hgroup>
       
    <CompareTableRuns
        v-show="testResults.length == 0"
        :testRuns="testRuns" :numReports="testRuns.length" />
    <CompareTableResults :testResults="testResults" :identifiers="testRuns.map(tR => tR.Identifier)" />
</template>

<script lang="ts">
import CompareTableRuns from '@/components/CompareTableRuns.vue'
import {type ITestResult, type ITestRun} from '@/lib/data_types'
import CompareTableResults from '@/components/CompareTableResults.vue';

export default {
    name: "Compare",
    components: { CompareTableRuns, CompareTableResults },
    data() {
        return {
            testRuns: [] as ITestRun[],
            testResults: [] as ITestResult[]
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
            this.$api.getTestRuns(identifiers as string[], true).then(response => {
                this.testRuns = response;
            });
        },
        fetchResults() {
            if (!this.$route.params["identifiers"]) {
                return;
            }
            let identifiers = this.$route.params["identifiers"]
            if (identifiers.length == 0) {
                return;
            }
            if (this.$route.query["className"] && this.$route.query["methodName"]) {
                this.$api.getTestResults(identifiers as string[], this.$route.query["className"] as string, this.$route.query["methodName"] as string)
                    .then((results) => {
                        this.testResults = results;
                    });   
            } else {
                this.testResults = [];
            }
        }
        
    },
    created() {
        this.fetchReports();
        this.fetchResults();
    },
    watch: {
        '$route.query'(query) {
            this.fetchResults();
        }
    }
}
</script>

<style scoped>

</style>