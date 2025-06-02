<template>
    <article v-if="testRun.MetaData != undefined">
            <header class="run-summary" v-if="testRun">
                <table>
                <!--<span><strong>TLS Version:</strong> todo</span>-->
                <tr v-if="testRun.TestClass">
                    <td><strong>Test Class:</strong></td>
                    <td>{{ testRun.TestClass.substring(31) }}</td>
                </tr>
                <tr>
                    <td><strong>Test Method:</strong></td>
                    <td>{{ testRun.TestMethod }}</td>
                </tr>
                <tr v-if="testRun.MetaData.tags">
                    <td><strong>Tags: </strong></td>
                    <td>{{ testRun.MetaData.tags.join(", ") }}</td>
                </tr>
                </table>
            </header>
            <main>
                <div class="summary-main-flex">
                    <div>
                        <div v-if="testRun.MetaData.rfc">
                            <span><strong>RFC:</strong> {{ testRun.MetaData.rfc.number || "not set" }}</span>
                            <span><strong> Setion:</strong> {{ testRun.MetaData.rfc.section }}</span>
                        </div>
                        <strong>Quote:</strong>
                        <blockquote><samp>{{ testRun.MetaData.description }}</samp></blockquote>
                        <div v-if="testRun && showResults"><strong>Result: </strong> {{ getResultSymbolsTestRun(testRun) }} {{ formatEnum(testRun.Result) }}</div>
                        <div v-if="testRun && testRun.FailureInducingCombinations">
                            <strong>Failure Inducing Combinations:</strong>
                            <ul>
                                <li v-for="combination of testRun.FailureInducingCombinations.slice(0, 3)">
                                    <template v-for="(derivation, parameter) in combination"><strong>{{ parameter }}: </strong>{{ derivation }}<br></template>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <CircularProgress v-if="testRun && testRun.TestCases && testRun.TestCases.length > 0 && showResults"
                        :progress="(testRun.SucceededCases + testRun.ConSucceededCases) * 100 / testRun.TestCases.length"
                        :name="`${testRun.SucceededCases + testRun.ConSucceededCases}/${testRun.TestCases.length}`"/>
                </div>
                <div v-if="testRun && testRun.FailedReason && showResults">
                            <strong>Failed Reason:</strong>
                            <figure><code>{{ testRun.FailedReason }}</code></figure>
                </div>
                <div v-if="testRun && testRun.DisabledReason && showResults">
                            <strong>Disabled Reason:</strong> {{ testRun.DisabledReason }}
                </div>
            </main>
            <footer v-if="false">
                <progress></progress>
            </footer>
        </article>
</template>

<script lang="ts">
import CircularProgress from '@/components/CircularProgress.vue';
import { formatEnum, getResultSymbolsTestRun } from '@/composables/visuals';

export default {
    name: "TestRunSummary",
    components: { CircularProgress },
    props: ["testRun", "showResults"],
    methods: {
        getResultSymbolsTestRun,
        formatEnum
    }
}
</script>

<style scoped>
table {
    margin-bottom: 0;
}
td {
    padding: 0;
}
blockquote {
    margin: 0.2em;
}
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