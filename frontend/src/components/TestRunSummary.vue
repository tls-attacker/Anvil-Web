<template>
    <article v-if="testRun.MetaData != undefined">
            <header>
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
                        <div>
                            <b>Test Description:</b><br>
                            <span>{{ testRun.MetaData.description }}</span>
                        </div>
                        <br>
                        <div v-if="testRun && showResults"><strong>Result: </strong> {{ getResultSymbolsTestRun(testRun) }} {{ formatEnum(testRun.Result) }}</div>
                        <div v-if="testRun && testRun.FailureInducingCombinations">
                            <strong>Failure Inducing Combinations:</strong>
                            <ul>
                                <li v-for="combination of testRun.FailureInducingCombinations.slice(0, 3)">
                                    <template v-for="(derivation, parameter) in combination">
                                        <i>{{ parameter }}: </i>
                                        {{ derivation }}
                                    </template>
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
                            <figure><code>{{ testRun.FailedReason.replace("org.opentest4j.AssertionFailedError: ", "") }}</code></figure>
                </div>
                <div v-if="testRun && testRun.DisabledReason && showResults">
                            <strong>Disabled Reason:</strong> {{ testRun.DisabledReason }}
                </div>
            </main>
            <footer>
                <div class="grid" style="">
                    <button
                        :class="{secondary: true, outline: active_button != 'limitations'}" 
                        v-if="testRun.MetaData.limitations"
                        @click="activate_button('limitations', testRun.MetaData.limitations)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                        Limitations
                    </button>
                    <button
                        :class="{secondary: true, outline: active_button != 'requirements'}"
                        v-if="testRun.MetaData.rfc && testRun.MetaData.rfc.length > 0"
                        @click="activate_button('requirements', 'miau')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="9" y1="14" x2="15" y2="14"></line>
                            <line x1="9" y1="18" x2="15" y2="18"></line>
                        </svg>
                        Requirements
                    </button>
                    <button
                        :class="{secondary: true, outline: active_button != 'behaviour'}"
                        v-if="testRun.MetaData.expected_behaviour"
                        @click="activate_button('behaviour', testRun.MetaData.expected_behaviour)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="8"/>
                                <path d="M9 12l2 2 4-4"/>
                        </svg>
                        Expected Behaviour
                    </button>
                    <button
                        :class="{secondary: true, outline: active_button != 'impact'}"
                        v-if="testRun.MetaData.impact"
                        @click="activate_button('impact', testRun.MetaData.impact)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="8"/>
                                <circle cx="12" cy="12" r="4"/>
                                <path d="M12 10.5v3M10.5 12h3"/>
                            </g>
                            <circle cx="12" cy="12" r="1" fill="currentColor"/>
                        </svg>
                        Impact
                    </button>
                    <button
                        :class="{secondary: true, outline: active_button != 'suggestion'}"
                        v-if="testRun.MetaData.suggestion"
                        @click="activate_button('suggestion', testRun.MetaData.suggestion)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 4a6 6 0 0 1 6 6c0 2-1 3.5-2 4.5s-2 2-2 3.5h-4c0-1.5-1-2.5-2-3.5s-2-2.5-2-4.5a6 6 0 0 1 6-6z"/>
                                <path d="M10 18h4M10.5 20h3"/>
                            </g>
                            <circle cx="12" cy="4" r="0.8" fill="currentColor"/>
                        </svg>
                        Suggestion
                    </button>
                </div>
                <div v-if="active_button == 'requirements'">
                    <div v-for="rfc in testRun.MetaData.rfc">
                            <span><strong>RFC:</strong> <a :href="`https://www.rfc-editor.org/rfc/rfc${rfc.number}`">{{ rfc.number || "not set" }}</a></span>
                            <span><strong> Section:</strong> {{ rfc.section }}</span>
                            <br/>
                            <strong>Quote:</strong>
                            <blockquote><samp>{{ rfc.requirement }}</samp></blockquote>
                        </div>
                </div>
                <div v-else>
                    {{ lower_infos }}
                </div>
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
    data () {
        return {
            lower_infos: "",
            active_button: ""
        }
    },
    methods: {
        getResultSymbolsTestRun,
        formatEnum,
        activate_button(name: string, infos: string) {
            if (this.active_button == name) {
                this.active_button = "";
                this.lower_infos = "";
            } else {
                this.active_button = name;
                this.lower_infos = infos;
            }
        }
    }
}
</script>

<style scoped>
li, details>*:not(summary), details blockquote {
    font-size: medium;
}
blockquote {
    padding-bottom: 5px;
    padding-top: 5px;
}
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