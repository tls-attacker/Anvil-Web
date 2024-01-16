<template>
    <article v-if="metaDataContainer != undefined">
            <header class="run-summary" v-if="testRun">
                <!--<span><strong>TLS Version:</strong> todo</span>-->
                <span v-if="testRun.TestClass"><strong>Test Class:</strong> {{ testRun.TestClass.substring(31) }}</span>
                <span><strong>Test Method:</strong> {{ testRun.TestMethod }}</span>
                <span v-if="metaDataContainer.tags"><strong>Tags: </strong>{{ metaDataContainer.tags.join(", ") }}</span>
            </header>
            <main>
                <div class="summary-main-flex">
                    <div>
                        <div v-if="metaDataContainer.rfc">
                            <span><strong>RFC:</strong> {{ metaDataContainer.rfc.number || "not set" }}</span>
                            <span><strong> Setion:</strong> {{ metaDataContainer.rfc.section }}</span>
                        </div>
                        <blockquote><samp>{{ metaDataContainer.description }}</samp></blockquote>
                        <div v-if="testRun"><strong>Result: </strong> {{ testRun.Result }}</div>
                        <div v-if="testRun && testRun.FailureInducingCombinations">
                            <strong>Failure Inducing Combinations:</strong>
                            <ul>
                                <li v-for="combination of testRun.FailureInducingCombinations.slice(0, 3)">
                                    <template v-for="(derivation, parameter) in combination"><strong>{{ parameter }}: </strong>{{ derivation }}<br></template>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <CircularProgress v-if="testRun && testRun.TestCases && testRun.TestCases.length > 0"
                        :progress="(testRun.SucceededCases + testRun.ConSucceededCases) * 100 / testRun.TestCases.length"
                        :name="`${testRun.SucceededCases + testRun.ConSucceededCases}/${testRun.TestCases.length}`"/>
                </div>
                <div v-if="testRun && testRun.FailedReason">
                            <strong>Failed Reason:</strong>
                            <figure><code>{{ testRun.FailedReason }}</code></figure>
                        </div>
            </main>
            <footer>
                <progress v-if="false"></progress>
            </footer>
        </article>
</template>

<script lang="ts">
import CircularProgress from '@/components/CircularProgress.vue';

export default {
    name: "TestRunSummary",
    components: { CircularProgress },
    props: ["testId", "testRun"],
    data() {
        return {
            metaDataContainer: undefined as any
        }
    },
    created() {
        this.metaDataContainer = this.$api.getMetaData(this.testId);
    }
}
</script>

<style scoped>
.run-summary {
    display: flex;
    flex-direction: column;
}
.summary-main-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}
</style>