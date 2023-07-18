<template>
    <dialog open>
        <article>
            <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')">
            </a>
            <h3>Cancel Job</h3>
            <p>
                Are you sure, that you want to cancel the following job? It will be stopped and deleted from the job queue.
                Any test-data that is already stored in the database will <strong>not</strong> be deleted.
            </p>
            <br>
            <ul>
                <li><strong>{{ job.identifier }}</strong></li>
            </ul>
            <template v-if="job.status == 'TESTING'">
                This job has already started testing. The test will be stopped and the job will be deleted.
                All testdata that is already saved to the database will remain.
            </template>
            <template v-else-if="job.status == 'SCANNING'">
                This job is currently scanning, but has not started testing. The scan will be stopped and the job will be deleted.
                No data will be saved to the database.
            </template>
            <template v-else>
                This job is still queued. It will be deleted, and no test-data will be saved to the database.
            </template>
            <p v-if="error">Error canceling job.</p>
            <footer>
                <a href="" role="button" class="secondary" @click.prevent="$emit('close')">
                    Close
                </a>
                <a href="" role="button" class="negative"
                    @click.prevent="confirmDelete"
                    :aria-busy="waiting">
                    Cancel Job
                </a>
            </footer>
        </article>
    </dialog>
</template>

<script lang="ts">
export default {
    name: "CancelJobDialog",
    props: ["open", "job"],
    emits: ["close"],
    data() {
        return {
            waiting: false,
            error: false
        }
    },
    methods: {
        confirmDelete() {
            this.waiting = true;
            this.error = false;
            
            this.$api.cancelJob(this.job.id)
            .then(() => {
                this.waiting = false;
                this.$emit("close");
            })
            .catch(() => {
                this.error = true;
                this.waiting = false;
            });
        }
    }
}
</script>

<style></style>