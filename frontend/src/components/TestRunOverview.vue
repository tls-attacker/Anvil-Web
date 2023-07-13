<template>
    <article
            class="testrun-container" :class="{selected: selected}">
                <div class="testrun-inner-flex">
                    <input type="checkbox" :checked="selected" v-on:change="$emit('update:selected', (<HTMLInputElement>$event.target).checked)"/>
                    <div style="flex-grow: 1;">
                        <h4>{{ testRun.Identifier }}</h4>
                        <div class="grid" style="margin-bottom: 10px;">
                            <span>Date: {{ $api.formatDate(testRun.Date+"") }}</span>
                            <span>Elapsed Time: <template v-if="testRun.Running">{{ elapsedTime }}</template><template v-else>{{ $api.millisecondsToTime(testRun.ElapsedTime) }}</template></span>
                            <span>States: {{ testRun.StatesCount }}</span>
                        </div>
                        <TestBar :disabledTests="testRun.DisabledTests" :succeededTests="testRun.SucceededTests" :failedTests="testRun.FailedTests"/>
                        <progress v-if="testRun.Running"></progress>
                        <div class="buttons" style="margin-top: 10px;">
                            <RouterLink :to="`tests/${testRun.Identifier}`" role="button" class="outline">Details</RouterLink>
                            <a href="" role="button" class="outline">Re-Run</a>
                            <a href="" role="button" v-if="testRun.Running" class="outline">Pause</a>
                            <a href="" role="button" v-if="testRun.Running" class="outline">Stop</a>
                        </div>
                    </div>
                    <CircularProgress :progress="calculateOverallScore(testRun)" name="Score" v-if="!testRun.Running"/>
                </div>
            </article>
</template>

<script lang="ts">
import type { ITestRun } from '@/lib/data_types';
import CircularProgress from './CircularProgress.vue';
import TestBar from './TestBar.vue';

export default {
    name: "TestRunOverview",
    components: {CircularProgress, TestBar},
    props: ["testRun", "selected"],
    emits: ["update:selected"],
    data() {
        return {
            currentTime: Date.now()
        }
    },
    methods: {
        calculateOverallScore(testRun: ITestRun) {
            let count = 0;
            let score = 0;
            for (let category of Object.keys(testRun.Score)) {
                // @ts-ignore
                score += testRun.Score[category].Percentage;
                count += 1;
            }
            return score/count;
        },
        getElapesTime() {
            if (this.testRun.Running) {
                return this.$api.millisecondsToTime(Date.now()-new Date(this.testRun.Date+"").getTime());
            } else {
                return this.$api.millisecondsToTime(this.testRun.ElapsedTime);
            }
        }
    },
    computed: {
        startedTime() {
            return new Date(this.testRun.Date+"").getTime();
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
.testrun-inner-flex {
    display: flex;
    align-items: center;
    gap: 30px;
}
.testrun-container:hover {
    background-color: rgba(0, 0, 0, 0.025);
}
.testrun-container.selected {
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