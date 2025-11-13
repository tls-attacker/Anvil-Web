<template>
    <dialog id="modal-example" :open="open">
        <article>
            <a href="" aria-label="Close" class="close" data-target="modal-example" @click.prevent="$emit('close')">
            </a>
            <h3>Upload Test Report</h3>
            <p>
                To upload a single test report, zip your result folder (containing the report.json) and upload it here.
            </p>
            <br/>
            <label>
                Report:
                <input type="file" accept=".zip" v-on:change="(e) => files = (<HTMLInputElement>e.target).files">
            </label>
            <p v-if="error.length>0">Error uploading file. {{ error }}</p>
            <progress v-if="uploading" :value="progress"></progress>
            <footer>
                <a href="" role="button" class="secondary" data-target="modal-example" @click.prevent="$emit('close')">
                    Cancel
                </a>
                <a :href="(files && files.length > 0 && !uploading) ? '' : undefined" role="button" data-target="modal-example" class="positive"
                    @click.prevent="upload"
                    :aria-busy="uploading">
                    Upload
                </a>
            </footer>
        </article>
    </dialog>
</template>

<script lang="ts">
export default {
    name: "UploadDialog",
    props: ["open"],
    emits: ["close"],
    data() {
        return {
            progress: 0 as number | undefined,
            uploading: false,
            files: null as FileList | null,
            error: ""
        }
    },
    methods: {
        upload() {
            if (this.files == null || this.files.length != 1) return;

            this.uploading = true;
            this.error = "";
            let formdata = new FormData();
            let file = this.files[0]
            let fileSize = file.size;

            formdata.append('report', file);

            var request = new XMLHttpRequest();

            request.upload.addEventListener('progress', (e) => {
                if (e.loaded <= fileSize) {
                    var percent = Math.round(e.loaded / fileSize * 100);
                    this.progress = percent;
                }

                if (e.loaded == e.total) {
                    this.progress = undefined;
                }
            });
            request.addEventListener('load', (e) => {
                this.uploading = false;
                if (request.status != 200) {
                    this.error = request.responseText;
                } else {
                    this.$emit("close");
                }
            });
            request.addEventListener('error', (e) => {
                this.uploading = false;
                this.error = "Error during upload.";
            })

            request.addEventListener('timeout', (e) => {
                this.uploading = false;
                this.error = "Timeout reached. The file may still be processing in the background. You can close this window.";
            })

            /** TODO: migrate to $api object in the future? */
            request.open('post', `${this.$api.baseUrl}uploadReport`);
            request.timeout = 180000;
            request.send(formdata);
        }
    }
}
</script>

<style></style>