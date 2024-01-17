<template>
    <header class="flex-header">
        <h1>Controller</h1>
        <span class="spacer"></span>
        <a href="" role="button" @click.prevent="newJobOpen = true">New Job</a>
    </header>
    <main>
        <h2>Jobs</h2>
        <div class="job-container">
            <article v-if="jobList.length == 0">
                No jobs created.
                <br /> <br>
                <a href="" role="button" class="outline" @click.prevent="newJobOpen = true">New Job</a>
            </article>
            <article v-else>
                <table role="grid">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Identifier</th>
                            <th>ID</th>
                            <th>Worker</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="job in jobList" :class="{ 'job-clickable': job.identifier != 'unset' }">
                            <td :aria-busy="job.status != 'QUEUED'" @click.prevent="gotoReport(job)"></td>
                            <td @click.prevent="gotoReport(job)">{{ job.identifier }}</td>
                            <td @click.prevent="gotoReport(job)">{{ job.id }}</td>
                            <td @click.prevent="gotoReport(job)">{{ job.workerName }}</td>
                            <td @click.prevent="gotoReport(job)">{{ job.status }}</td>
                            <td><a href="" role="button" class="outline negative"
                                    @click.prevent="cancelJob = true; selectedJob = job">Cancel</a></td>
                        </tr>
                    </tbody>
                </table>
            </article>
        </div>
        <h2>Worker</h2>
        <article v-if="workerList.length == 0">
            No worker available. Please start TLS-Anvil in worker mode.
        </article>
        <div class="worker-container">
            <template v-for="worker of workerList">
                <article>
                    <main>
                        <h3>{{ worker.name }}</h3>
                        <strong>ID:</strong> {{ worker.id }} <br>
                        <strong>Status:</strong> {{ worker.status }} <br>
                        <strong>Jobs:</strong>
                        <ul v-if="worker.jobs.length > 0">
                            <li v-for="job of worker.jobs">
                                {{ job.identifier }}
                            </li>
                        </ul>
                        <span v-else>
                            No Jobs running.
                        </span>
                        <br>
                        <code v-if="worker.logs">
                            {{ worker.logs }}
                        </code>
                    </main>
                    <footer class="buttons">
                        <span v-if="worker.status == 'WORKING'" :aria-busy="true"></span>
                        <a href="" role="button" class="outline"
                            @click.prevent="selectedWorker = worker.id; newJobOpen = true">
                            <template v-if="worker.status == 'WORKING'">Queue Job</template>
                            <template v-else>New Job</template>
                        </a>
                        <a href="" role="button" class="outline negative">Shutdown</a>
                    </footer>
                </article>
            </template>
        </div>
    </main>
    <NewJobDialog v-if="newJobOpen" @close="newJobOpen = false; selectedWorker = ''; refreshWorkerJobs()"
        :workers="workerList" :workerId="selectedWorker" />
    <CancelJobDialog v-if="cancelJob" :job="selectedJob" @close="cancelJob = false; refreshWorkerJobs()" />
</template>

<script lang="ts">
import { type IAnvilJob, type IAnvilWorker } from '@/lib/data_types'
import NewJobDialog from '@/components/NewJobDialog.vue';
import CancelJobDialog from '@/components/CancelJobDialog.vue';

export default {
    name: "ControllerView",
    components: { NewJobDialog, CancelJobDialog },
    data() {
        return {
            workerList: [] as IAnvilWorker[],
            jobList: [] as IAnvilJob[],
            newJobOpen: false,
            selectedWorker: "",
            timer: 0,
            selectedJob: {} as IAnvilJob,
            cancelJob: false
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
        },
        gotoReport(job: IAnvilJob) {
            if (!job.identifier || job.identifier == 'unset') {
                return;
            }
            this.$router.push(`/tests/${job.identifier}`);
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
.buttons>* {
    margin-right: 10px;
}

h3 {
    margin-bottom: 5px;
}

h2 {
    margin-bottom: 10px;
}

.worker-container {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.worker-container>* {
    min-width: calc(50% - 10px);
    flex-grow: 1;
}

.job-container {
    margin-bottom: 20px;
}
article {
    margin-top: 10px;
    margin-bottom: 0;
}

.job-clickable:hover {
    cursor: pointer;
    --table-row-stripped-background-color: rgb(227, 227, 227);
    background-color: rgb(227, 227, 227);
}

code {
    white-space: pre-line;
    max-height: 10rem;
    width: 100%;
    overflow-x: scroll;
}
</style>