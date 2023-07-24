<template>
    <article>
            <header class="run-summary">
                <span><strong>TLS Version:</strong> {{ testMethod.TlsVersion }}</span>
                <span><strong>Test Class:</strong> {{ testMethod.ClassName.substring(31) }}</span>
                <span><strong>Test Method:</strong> {{ testMethod.MethodName }}</span>
            </header>
            <main>
                <div class="summary-main-flex">
                    <div>
                        <div v-if="testMethod.RFC">
                            <span><strong>RFC:</strong> {{ testMethod.RFC.number || "not set" }}</span>
                            <span><strong> Setion:</strong> {{ testMethod.RFC.Section }}</span>
                        </div>
                        <blockquote><samp>{{ testMethod.Description }} {{ testMethod.TestDescription }}</samp></blockquote>
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
                        :progress="(testRun.SucceededStates + testRun.ConSucceededStates) * 100 / testRun.TestCases.length"
                        :name="`${testRun.SucceededStates + testRun.ConSucceededStates}/${testRun.TestCases.length}`"/>
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
    props: ["testMethod", "testRun"],
    components: { CircularProgress }
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