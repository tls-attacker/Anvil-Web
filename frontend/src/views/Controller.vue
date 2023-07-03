<template>
    <header class="flex-header">
        <h1>Controller</h1>
        <span class="spacer"></span>
        <a href="" role="button">New Job</a>
    </header>
    <main>
        <h2>Worker</h2>
        <template v-for="worker of workerList">
            <article>
                <header>
                    <h3 style="margin-bottom: 0;">{{ worker.name }}</h3>
                </header>
                <main>
                    {{ worker.id }}
                    No Jobs running.
                </main>
                <footer>
                    <a href="" role="button" class="outline">New Job</a>
                </footer>
            </article>
        </template>
        <h2>Jobs</h2>
        <template v-if="true">
            <article>Test</article>
        </template>
    </main>
</template>

<script lang="ts">
import { type IAnvilWorker } from '@/lib/data_types'

export default {
    name: "Controller",
    data() {
        return {
            workerList: [] as IAnvilWorker[]
        }
    },
    methods: {
        refreshWorker() {
            this.$api.getWorkerList().then((workerList) => {
                this.workerList = workerList;
            })
        }
    },
    created() {
        this.refreshWorker();
    },
}
</script>

<style scoped>

</style>