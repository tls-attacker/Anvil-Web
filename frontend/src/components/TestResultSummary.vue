<template>
    <article>
            <header class="result-summary">
                <span><strong>TLS Version:</strong> {{ testMethod.TlsVersion }}</span>
                <span><strong>Test Class:</strong> {{ testMethod.ClassName.substring(31) }}</span>
                <span><strong>Test Method:</strong> {{ testMethod.MethodName }}</span>
            </header>
            <main>
                <div class="summary-main-flex">
                    <div>
                        <div v-if="testMethod.RFC">
                            <span><strong>RFC:</strong> {{ testMethod.RFC.number || "not set" }}</span>
                            <span><strong>Setion:</strong> {{ testMethod.RFC.Section }}</span>
                        </div>
                        <blockquote><samp>{{ testMethod.Description }}</samp></blockquote>
                        <div v-if="testResult && testResult.FailureInducingCombinations">
                            <strong>Failure Inducing Combinations:</strong>
                            <ul>
                            <li v-for="combination of testResult.FailureInducingCombinations.slice(0, 3)">
                                <span v-for="(derivation, parameter) in combination"><strong>{{ parameter }}: </strong>{{ derivation }}</span>
                            </li>
                        </ul>
                        </div>
                    </div>
                    <CircularProgress v-if="testResult"
                        :progress="(testResult.SucceededStates + testResult.ConSucceededStates) * 100 / testResult.StatesCount"
                        :name="`${testResult.SucceededStates + testResult.ConSucceededStates}/${testResult.StatesCount}`"/>
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
    name: "TestResultSummary",
    props: ["testMethod", "testResult"],
    components: { CircularProgress }
}
</script>

<style scoped>
.result-summary {
    display: flex;
    flex-direction: column;
}
.summary-main-flex {
    display: flex;
    justify-content: space-between;
}
</style>