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
                    <h3>{{ worker.name }}</h3>
                </header>
                <main>
                    ID: {{ worker.id }} <br>
                    Status: {{ worker.status }} <br>
                    Jobs:
                    <ul v-if="worker.jobs.length>0">
                        <li v-for="job of worker.jobs">
                            {{ job.identifier }}
                        </li>
                    </ul>
                    <span v-else>
                        No Jobs running.
                    </span>
                </main>
                <footer class="buttons">
                    <span v-if="worker.status == 'WORKING'" :aria-busy="true"></span>
                    <a href="" role="button" class="outline">New Job</a>
                    <a href="" role="button" class="outline negative">Shutdown</a>
                </footer>
            </article>
        </template>
        <h2>Jobs</h2>
        <article v-if="jobList.length==0">
            No jobs created.
            <br/> <br>
            <a href="" role="button" class="outline" @click.prevent="newJobOpen = true">New Job</a>
        </article>
        <template v-for="job of jobList">
            <article>
                <header>
                    <h3>{{ job.identifier }}</h3>
                </header>
                <main>
                    ID: {{ job.id }} <br>
                    Status: {{ job.status }} <br>
                    Worker: {{ job.workerName }} <br>
                    Config: <br>
                    <code>{{ job.config }}</code>
                </main>
                <footer>
                    <progress :value="job.progress" max="100"></progress>
                    <div class="buttons">
                        <span v-if="job.status == 'RUNNING'" :aria-busy="true"></span>
                        <RouterLink :to="`/tests/${job.identifier}`" role="button" class="outline">Test Details</RouterLink>
                        <a href="" role="button" class="outline">Pause</a>
                        <a href="" role="button" class="outline negative">Cancel</a>
                    </div>
                </footer>
            </article>
        </template>
    </main>
    <NewJobDialog v-if="newJobOpen" @close="newJobOpen = false" :workers="workerList"/>
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
            newJobOpen: false,
            timer: 0
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
        this.timer = setInterval(() => this.refreshWorkerJobs(), 10000);
        this.refreshWorkerJobs();
    },
    unmounted() {
        clearInterval(this.timer);
    }
}
</script>

<style scoped>
.buttons > * {
    margin-right: 10px;
}
h3 {
    margin-bottom: 0;
}
</style>