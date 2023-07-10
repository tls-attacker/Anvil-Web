<template>
    <dialog open>
        <article>
            <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')">
            </a>
            <h3>Create new Job</h3>
            <p>
                Start a TLS-Anvil-Testrun with the desired configuration. The job will be run by the first worker, that is idle, unless you specify a worker that should take the job.
            </p>
            <br/>
            <form>
                <input type="text" v-model="config">
            </form>
            <footer>
                <a href="" role="button" class="secondary" @click.prevent="$emit('close')">
                    Cancel
                </a>
                <a href="" role="button"
                    @click.prevent="createJob"
                    :aria-busy="waiting">
                    Create
                </a>
            </footer>
        </article>
    </dialog>
</template>

<script lang="ts">
export default {
    name: "NewJobDialog",
    props: ["open", "identifiers"],
    emits: ["close"],
    data() {
        return {
            waiting: false,
            error: false,
            config: ""
        }
    },
    methods: {
        createJob() {
            this.waiting = true;
            this.error = false;
            
            this.$api.addJob(this.config)
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