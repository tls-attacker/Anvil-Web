<template>
    <div class="circle-container" :data-tooltip="`${Math.round(progress)} %`">
        <div class="wrapper" :class="{ noclip: progress > 50 }">
            <div class="circle" :style="{ transform: `rotate(${Math.min(Math.round(progress * 360 / 100), 180)}deg)` }"></div>
            <div class="circle" :style="{ transform: `rotate(${Math.round(progress * 360 / 100)}deg)` }"></div>
        </div>
        <div class="circle-back"></div>
        <div class="label">{{ name }}</div>
    </div>
</template>

<script lang="ts">
export default {
    name: "CircularProgress",
    props: ["name", "progress"]
}
</script>

<style scoped>
.circle-container {
    width: 100px;
    /* Set the size of the progress bar */
    height: 100px;
    position: relative;
}

.wrapper {
    width: 100px;
    /* Set the size of the progress bar */
    height: 100px;
    /* Enable clipping */
    position: absolute;
    clip: rect(0px, 100px, 100px, 50px);
    /* Hide half of the progress bar */
}
.wrapper.noclip {
    clip: auto;
}

/* Set the sizes of the elements that make up the progress bar */
.circle {
    width: 100px;
    height: 100px;
    border: 15px solid green;
    border-radius: 50px;
    position: absolute;
    clip: rect(0px, 50px, 100px, 0px);
}

.circle-back {
    width: 100px;
    height: 100px;
    border-radius: 50px;
    border: 15px solid rgb(165, 165, 165);
}
.label {
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    text-align: center;
    line-height: 100px;
}
</style>