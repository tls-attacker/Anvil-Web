<template>
    <article
            class="report-container" :class="{selected: selected}">
                <div class="report-inner-flex">
                    <input type="checkbox" :checked="selected" v-on:change="$emit('update:selected', (<HTMLInputElement>$event.target).checked)"/>
                    <div style="flex-grow: 1;">
                        <h4>{{ report.Identifier }}</h4>
                        <div class="grid" style="margin-bottom: 10px;">
                            <span>Date: {{ $api.formatDate(report.Date+"") }}</span>
                            <span>Tests run: {{ report.FinishedTests }}</span>
                            <span>Time elapsed: <template v-if="report.Running">{{ elapsedTime }}</template><template v-else>{{ $api.millisecondsToTime(report.ElapsedTime) }}</template></span>
                        </div>
                        <TestBar :disabledTests="report.DisabledTests" :succeededTests="report.StrictlySucceededTests+report.ConceptuallySucceededTests"
                            :failedTests="report.FullyFailedTests+report.PartiallyFailedTests" :errors="report.TestSuiteErrorTests"/>
                        <progress v-if="report.Running"></progress>
                        <div class="buttons" style="margin-top: 10px;">
                            <RouterLink :to="`tests/${report.Identifier}`" role="button" class="outline">Details</RouterLink>
                            <a href="" role="button" class="outline" @click.prevent="rerun = true">Re-Run</a>
                            <a href="" role="button" v-if="report.Running" class="outline negative">Stop</a>
                        </div>
                    </div>
                    <CircularProgress :progress="calculateOverallScore(report)" name="Score" v-if="!report.Running && report.Score"/>
                </div>
                <NewJobDialog v-if="rerun" @close="rerun = false" :givenConfig="report.AnvilConfig" :givenAdditionalConfig="report.AdditionalConfig"/>
            </article>
</template>

<script lang="ts">
import type { IReport } from '@/lib/data_types';
import CircularProgress from './CircularProgress.vue';
import TestBar from './TestBar.vue';
import NewJobDialog from './NewJobDialog.vue';

export default {
    name: "ReportOverview",
    components: { CircularProgress, TestBar, NewJobDialog },
    props: ["report", "selected"],
    emits: ["update:selected"],
    data() {
        return {
            currentTime: Date.now(),
            rerun: false
        }
    },
    methods: {
        calculateOverallScore(report: IReport) {
            if (!report.Score) {
                return 0;
            }
            let count = 0;
            let score = 0;
            for (let category of Object.keys(report.Score)) {
                // @ts-ignore
                score += report.Score[category];
                count += 1;
            }
            return score/count;
        },
        getElapesTime() {
            if (this.report.Running) {
                return this.$api.millisecondsToTime(Date.now()-new Date(this.report.Date+"").getTime());
            } else {
                return this.$api.millisecondsToTime(this.report.ElapsedTime);
            }
        }
    },
    computed: {
        startedTime() {
            return new Date(this.report.Date+"").getTime();
        },
        elapsedTime() {
            return this.$api.millisecondsToTime(this.$time.value-this.startedTime);
        }
    },
    created() {
        setInterval(() => this.currentTime+=1000, 1000);
    },
    unmounted() {

    }
}
</script>

<style scoped>
.report-inner-flex {
    display: flex;
    align-items: center;
    gap: 30px;
}
.report-container:hover {
    background-color: rgba(0, 0, 0, 0.025);
}
.report-container.selected {
    background-color: rgba(0, 0, 0, 0.050);
}
h4 {
    margin-bottom: 10px;
}
.buttons>* {
    margin-right: 10px;
}
progress {margin-top: 20px;}
</style>