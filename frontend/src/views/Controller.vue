<template>
    <header class="flex-header">
        <h1>Controller</h1>
        <span class="spacer"></span>
        <a href="" role="button" @click.prevent="newJobOpen = true">New Job</a>
    </header>
    <main>
        <h2>Worker</h2>
        <article v-if="workerList.length==0">
            No worker available. Please start TLS-Anvil in worker mode.
        </article>
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
                    <a href="" role="button" class="outline">New Job</a> <span aria-busy="true"></span>
                </footer>
            </article>
        </template>
        <h2>Jobs</h2>
        <article v-if="jobList.length==0">
            No jobs created.
            <br/>
            <a href="" role="button" class="outline">New Job</a>
        </article>
        <template v-for="job of jobList">
            <article>
                <header>
                    Job: {{ job.id }}
                </header>
                <main>
                    {{ job.config }}
                </main>
                <footer>
                    <progress :value="job.progress" max="100"></progress>
                </footer>
            </article>
        </template>
    </main>
    <NewJobDialog v-if="newJobOpen" @close="newJobOpen = false"/>
</template>

<script lang="ts">
import { type IAnvilJob, type IAnvilWorker } from '@/lib/data_types'
import NewJobDialog from '@/components/NewJobDialog.vue';

export default {
    name: "Controller",
    components: { NewJobDialog },
    data() {
        return {
            workerList: [] as IAnvilWorker[],
            jobList: [] as IAnvilJob[],
            newJobOpen: false
        };
    },
    methods: {
        refreshWorkerJobs() {
            this.$api.getWorkerList().then((workerList) => {
                this.workerList = workerList;
            });
            this.$api.getJobList().then((jobList) => {
                this.jobList = jobList;
            });
        }
    },
    created() {
        this.refreshWorkerJobs();
    }
}
</script>

<style scoped>

</style>