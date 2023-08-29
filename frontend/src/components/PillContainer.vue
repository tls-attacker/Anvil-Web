<template>
    <div>
        <span v-for="pill in pills" @click.prevent="$emit('click', pill)">
            {{ pill }}
        </span>
    </div>
</template>

<script lang="ts">
export default {
    name: "PillContainer",
    props: ["pills"],
    emits: ["click"]
}
</script>

<style scoped>
div {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
span {
    background-color: rgb(255, 255, 255);
    border-radius: 20px;
    height: 40px;
    padding: 5px 20px;
    cursor: pointer;
}
span:hover {
    background-color: rgb(183, 183, 183);
}
</style>