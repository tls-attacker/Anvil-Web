<template>
    <article v-if="metaDataContainer != undefined">
            <header class="run-summary">
                <span><strong>TLS Version:</strong> todo</span>
                <span><strong>Test Class:</strong> {{ testClass.substring(31) }}</span>
                <span><strong>Test Method:</strong> {{ testMethod }}</span>
            </header>
            <main>
                <div class="summary-main-flex">
                    <div>
                        <div v-if="metaDataContainer.rfc">
                            <span><strong>RFC:</strong> {{ metaDataContainer.rfc.number || "not set" }}</span>
                            <span><strong> Setion:</strong> {{ metaDataContainer.rfc.section }}</span>
                        </div>
                        <blockquote><samp>{{ metaDataContainer.description }}</samp></blockquote>
                        <div v-if="testRun && testRun.FailureInducingCombinations">
                            <strong>Failure Inducing Combinations:</strong>
                            <ul>
                            <li v-for="combination of testRun.FailureInducingCombinations.slice(0, 3)">
                                <template v-for="(derivation, parameter) in combination"><strong>{{ parameter }}: </strong>{{ derivation }}<br></template>
                            </li>
                        </ul>
                        </div>
                    </div>
                    <CircularProgress v-if="testRun"
                        :progress="(testRun.SucceededCases + testRun.ConSucceededCases) * 100 / testRun.TestCases.length"
                        :name="`${testRun.SucceededCases + testRun.ConSucceededCases}/${testRun.TestCases.length}`"/>
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
    props: ["testMethod", "testClass", "testRun"],
    data() {
        return {
            metaDataContainer: undefined as any
        }
    },
    created() {
        this.metaDataContainer = this.$api.getMetaData(this.testClass, this.testMethod);
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
}
</style>