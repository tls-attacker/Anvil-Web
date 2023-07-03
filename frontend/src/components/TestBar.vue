<template>
    <div class="testbar">
        <span 
            class="bar-part failed"
            :style="`flex: ${failedTests}`"
            data-tooltip="Failed Tests">{{ failedTests }}</span>
        <span
            class="bar-part succeeded"
            :style="`flex: ${succeededTests}`"
            data-tooltip="Succeeded Tests">{{ succeededTests }}</span>
        <span
            class="bar-part disabled"
            :style="`flex: ${disabledTests}`"
            data-tooltip="Disabled Tests">{{ disabledTests }}</span>
    </div>
</template>

<script lang="ts">
export default {
    name: "TestBar",
    props: ["disabledTests", "failedTests", "succeededTests"]
}
</script>

<style scoped>
.testbar {
    display: flex;
    border-radius: 5px;
    
}
.bar-part {
    padding: 5px;
    text-align: center;
}
.failed {
    background-color: rgb(200, 79, 79);
    color: white;
    border-radius: 5px 0px 0px 5px;
}
.succeeded {
    background-color: rgb(55, 100, 55);
    color: white;
}
.disabled {
    background-color: rgb(167, 167, 167);
    color: black;
    border-radius: 0px 5px 5px 0px;
}
</style>