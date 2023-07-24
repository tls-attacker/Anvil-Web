<template>
    <article
            class="report-container" :class="{selected: selected}">
                <div class="report-inner-flex">
                    <input type="checkbox" :checked="selected" v-on:change="$emit('update:selected', (<HTMLInputElement>$event.target).checked)"/>
                    <div style="flex-grow: 1;">
                        <h4>{{ report.Identifier }}</h4>
                        <div class="grid" style="margin-bottom: 10px;">
                            <span>Date: {{ $api.formatDate(report.Date+"") }}</span>
                            <span>Elapsed Time: <template v-if="report.Running">{{ elapsedTime }}</template><template v-else>{{ $api.millisecondsToTime(report.ElapsedTime) }}</template></span>
                            <span>States: {{ report.StatesCount }}</span>
                        </div>
                        <TestBar :disabledTests="report.DisabledTests" :succeededTests="report.SucceededTests" :failedTests="report.FailedTests"/>
                        <progress v-if="report.Running"></progress>
                        <div class="buttons" style="margin-top: 10px;">
                            <RouterLink :to="`tests/${report.Identifier}`" role="button" class="outline">Details</RouterLink>
                            <a href="" role="button" class="outline">Re-Run</a>
                            <a href="" role="button" v-if="report.Running" class="outline negative">Stop</a>
                        </div>
                    </div>
                    <CircularProgress :progress="calculateOverallScore(report)" name="Score" v-if="!report.Running"/>
                </div>
            </article>
</template>

<script lang="ts">
import type { IReport } from '@/lib/data_types';
import CircularProgress from './CircularProgress.vue';
import TestBar from './TestBar.vue';

export default {
    name: "ReportOverview",
    components: {CircularProgress, TestBar},
    props: ["report", "selected"],
    emits: ["update:selected"],
    data() {
        return {
            currentTime: Date.now()
        }
    },
    methods: {
        calculateOverallScore(report: IReport) {
            let count = 0;
            let score = 0;
            for (let category of Object.keys(report.Score)) {
                // @ts-ignore
                score += report.Score[category].Percentage;
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