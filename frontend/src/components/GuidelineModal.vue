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
                        <summary><strong>Violated ({{ (guidelineReport as IGuidelineReport).results.filter(g => g.adherence == "VIOLATED").length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in (guidelineReport as IGuidelineReport).results.filter(h => h.adherence == 'VIOLATED')">
                                    <td>{{ g.checkName }} <br> <pre>{{ g.info }}</pre></td>
                                    <td>❌</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                    <details>
                        <summary><strong>Adhered ({{ (guidelineReport as IGuidelineReport).results.filter(g => g.adherence == 'ADHERED').length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in (guidelineReport as IGuidelineReport).results.filter(h => h.adherence == 'ADHERED')">
                                    <td>{{ g.checkName }} <br> <pre>{{ g.info }}</pre></td>
                                    <td>✔</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                    <details>
                        <summary><strong>Check failed ({{ (guidelineReport as IGuidelineReport).results.filter(g => g.adherence == 'CHECK_FAILED').length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in (guidelineReport as IGuidelineReport).results.filter(h => h.adherence == 'CHECK_FAILED')">
                                    <td>{{ g.checkName }} <br> <pre>{{ g.info }}</pre></td>
                                    <td>💢</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                    <details>
                        <summary><strong>Condition not met ({{ (guidelineReport as IGuidelineReport).results.filter(g => g.adherence == 'CONDITION_NOT_MET').length }})</strong></summary>
                        <table role="grid">
                            <tbody>
                                <tr v-for="g in (guidelineReport as IGuidelineReport).results.filter(h => h.adherence == 'CONDITION_NOT_MET')">
                                    <td>{{ g.checkName }} <br> <pre>{{ g.info }}</pre></td>
                                    <td>❔</td>
                                </tr>
                            </tbody>
                        </table>
                    </details>
                </main>
            </article>
        </dialog>
</template>

<script lang="ts">
import { type IGuideline, type IGuidelineReport } from '../lib/data_types';
export default {
    name: "GuidelineModal",
    props: ["guidelineReport"],
    emits: ["close"],
    methods: {
        omitValues(guideline: any): any {
            const {_id, id, checkName, result,  ...strippedGuideline} = guideline;
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