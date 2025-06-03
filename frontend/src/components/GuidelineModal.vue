<template>
    <dialog open v-if="guidelineReport">
            <article>
                <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')"></a>
                <h4>Guideline Test Results</h4>
                {{ guidelineReport.name }} <a href="guidelineReport.link">(source)</a>
                </header>
                <main>
                    <template v-for="adherenceLevel in adherenceData">
                        <h5>{{adherenceLevel.name}} ({{ (guidelineReport as IGuidelineReport).results.filter(g => g.adherence == adherenceLevel.enum).length }})</h5>
                        
                                <div class="result-row"
                                    v-for="g in (guidelineReport as IGuidelineReport).results.filter(h => h.adherence == adherenceLevel.enum)">
                                    <div class="icon">{{ adherenceLevel.icon }}</div>
                                    <div>
                                        <strong>Quote: </strong>
                                        <blockquote>{{ g.checkName }}</blockquote>
                                        <strong>Result:</strong> {{ adherenceLevel.name }}
                                        <details>
                                            <summary role="button">Details</summary>
                                            <pre>{{ g.info }}</pre>
                                        </details>
                                    </div>
                                </div>
                        </template>
                </main>
            </article>
        </dialog>
</template>

<script lang="ts">
import { formatEnum } from '@/composables/visuals';
import { type IGuideline, type IGuidelineReport } from '../lib/data_types';
export default {
    name: "GuidelineModal",
    props: ["guidelineReport"],
    emits: ["close"],
    data() {
        return {
            adherenceData: [
                {
                    enum: "VIOLATED",
                    name: "Violated",
                    icon: "❌"

                },
                {
                    enum: "ADHERED",
                    name: "Adhered",
                    icon: "✔"

                },    
                {
                    enum: "CHECK_FAILED",
                    name: "Check Failed",
                    icon: "💢"

                },
                {
                    enum: "CONDITION_NOT_MET",
                    name: "Condition Not Met",
                    icon: "❔"

                }
            ]
        }
    },
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
summary[role="button"] {
    width: auto;
}
details {
    margin-top: 5px;
    margin-bottom: 0;
    padding-bottom: 5px;
}
.icon {
    margin-top: 50px;
    padding: 10px;
}
.result-row {
    display: flex;
    background-color: #f7f7f7;
    border-radius: 12px;
    margin-bottom: 15px;
    padding: 10px;
}
.result-row:hover {
    display: flex;
    background-color: aliceblue;
    border-radius: 12px;
    margin-bottom: 15px;
    padding: 10px;
}
blockquote {
    margin-top: 0;
    margin-bottom: 0;
}
article {
    min-width: 200px;
    max-width: 1000px;
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