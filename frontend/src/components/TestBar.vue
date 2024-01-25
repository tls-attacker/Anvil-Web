<template>
    <div class="testbar">
        <span
            v-if="failedTests > 0"
            class="bar-part failed"
            :style="`flex: ${failedTests}`"
            data-tooltip="Failed Tests"
            @click.prevent="click('failed')">
            {{ failedTests }}
        </span>
        <span
            v-if="succeededTests > 0"
            class="bar-part succeeded"
            :style="`flex: ${succeededTests}`"
            data-tooltip="Succeeded Tests"
            @click.prevent="click('succeeded')">
            {{ succeededTests }}
        </span>
        <span
            v-if="disabledTests > 0"
            class="bar-part disabled"
            :style="`flex: ${disabledTests}`"
            data-tooltip="Disabled Tests"
            @click.prevent="click('disabled')">
            {{ disabledTests }}
        </span>
        <span
            v-if="errors > 0"
            class="bar-part error"
            :style="`flex: ${errors}`"
            data-tooltip="Test Suite Errors"
            @click.prevent="click('error')">
            {{ errors }}
        </span>
    </div>
</template>

<script lang="ts">
import { TestResult } from '@/lib/data_types'

export default {
    name: "TestBar",
    props: ["disabledTests", "failedTests", "succeededTests", "errors", "clickable"],
    methods: {
        click(type: string) {
            if (!this.clickable) {
                return;
            }
            
            if (type == "failed") {
                this.$router.replace({query: {results: [TestResult.FULLY_FAILED, TestResult.PARTIALLY_FAILED]}})
            } else if (type == "succeeded") {
                this.$router.replace({query: {results: [TestResult.STRICTLY_SUCCEEDED, TestResult.CONCEPTUALLY_SUCCEEDED]}})
            } else if (type == "disabled") {
                this.$router.replace({query: {results: [TestResult.DISABLED]}})
            } else if (type == "error") {
                this.$router.replace({query: {results: [TestResult.TEST_SUITE_ERROR]}})
            }
        }
    }
}
</script>

<style scoped>
.testbar {
    display: flex;
    border-radius: 5px;
}
.bar-part:first-child {
    border-radius: 5px 0px 0px 5px;
}
.bar-part:last-child {
    border-radius: 0px 5px 5px 0px;
}
.bar-part {
    padding: 5px;
    text-align: center;
}
.failed {
    background-color: rgb(200, 79, 79);
    color: white;
}
.succeeded {
    background-color: rgb(55, 100, 55);
    color: white;
}
.disabled {
    background-color: rgb(167, 167, 167);
    color: black;
}
.error {
    background-color: rgb(54, 5, 5);
    color: white;
}
</style>