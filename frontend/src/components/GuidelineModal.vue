<template>
    <dialog open v-if="guidelineReport">
            <article>
                <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')"></a>
                {{ guidelineReport.name }} Guideline Test Results
                </header>
                <main>
                    <p><strong>Link: </strong> <a target="_blank" :href="guidelineReport.link">{{ guidelineReport.link }}</a></p>
                    <br>
                    <details open>
                        <summary><strong>Failed ({{ guidelineReport.failed.length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in guidelineReport.failed">
                                    <td>{{ g.name }} <br> <pre v-if="Object.keys(omitValues(g)).length > 0">{{ g.display }}</pre></td>
                                    <td>❌</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                    <details>
                        <summary><strong>Passed ({{ guidelineReport.passed.length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in guidelineReport.passed">
                                    <td>{{ g.name }} <br> <pre>{{ omitValues(g) }}</pre></td>
                                    <td>✅</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                    <details>
                        <summary><strong>Uncertain ({{ guidelineReport.uncertain.length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in guidelineReport.uncertain">
                                    <td>{{ g.name }}</td>
                                    <td>❔</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                    <details>
                        <summary><strong>Skipped ({{ guidelineReport.skipped.length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in guidelineReport.skipped">
                                    <td>{{ g.name }}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                </main>
            </article>
        </dialog>
</template>

<script lang="ts">
export default {
    name: "GuidelineModal",
    props: ["guidelineReport"],
    emits: ["close"],
    methods: {
        omitValues(guideline: any): any {
            const {_id, id, name, result,  ...strippedGuideline} = guideline;
            let textResult = JSON.stringify(strippedGuideline, null, 2);
            textResult = textResult.replace(/("|\[|\s*\]\s*|\s*{|\s*}\s*)/g, "");
            textResult = textResult.substring(1);
            return textResult;
        }
    }
}
</script>

<style scoped>
td {
    word-break: break-all;
}
article {
    max-width: 1000px;
}
th {
    font-weight: bold;
    background-color: rgb(209, 209, 209);
}
p {
    margin-bottom: 10px;
}

pre {
    padding: 10px;
    max-width: 800px;
    white-space: pre-wrap;
}
</style>