<template>
    <dialog open>
        <article>
            <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')">
            </a>
            <h3>Delete Test Report</h3>
            <p>
                Are you sure, that you want to delete the following test reports from the database?
            </p>
            <br/>
            <ul>
                <li v-for="identifier in identifiers">{{ identifier }}</li>
            </ul>
            <p v-if="error">Error deleting report(s).</p>
            <footer>
                <a href="" role="button" class="secondary" @click.prevent="$emit('close')">
                    Cancel
                </a>
                <a href="" role="button" class="negative"
                    @click.prevent="confirmDelete"
                    :aria-busy="waiting">
                    Delete
                </a>
            </footer>
        </article>
    </dialog>
</template>

<script lang="ts">
export default {
    name: "DeleteReportDialog",
    props: ["open", "identifiers"],
    emits: ["close", "deleted"],
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
            
            let promised = [];
            for (let identifier of this.identifiers) {
                promised.push(this.$api.deleteReport(identifier));
            }
            Promise.all(promised)
            .then(() => {
                this.waiting = false;
                this.$emit("deleted");
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