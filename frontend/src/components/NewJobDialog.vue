<template>
    <dialog open>
        <article>
            <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')">
                </a>
                <h3>Create new Job</h3>
            </header>
            <main>
                <p>
                    Start a TLS-Anvil execution with the desired configuration. The job will be run by the first worker, that
                    is idle, unless you specify a worker that should take the job.
                </p>
                <br />
                <form>
                    <label>Worker:</label>
                    <select v-model="selectedWorker">
                        <option :value="undefined">Auto select</option>
                        <option v-for="worker of getWorkers" :value="worker.id">{{ worker.name }} ({{ worker.id }})</option>
                    </select>

                    <label>Identifier:
                        <input type="text" placeholder="example-test" v-model="config.identifier">
                    </label>
                    <label>Testmode:
                        <select v-model="config.endpointMode">
                            <option value="SERVER">Server</option>
                            <option value="CLIENT">Client</option>
                        </select>
                    </label>
                    <template v-if="config.endpointMode=='SERVER'">
                        <label>Server:
                            <input type="text" placeholder="testserver:443" v-model="additionalConfig.serverConfig.host">
                        </label>
                        <label>
                            <input type="checkbox" v-model="additionalConfig.serverConfig.doNotSendSNIExtension">
                            Do not send SNI Extension
                        </label>
                        <label v-if="!additionalConfig.serverConfig.doNotSendSNIExtension">Server Name (SNI):
                            <input type="text" v-model="additionalConfig.serverConfig.sniHostname">
                        </label>
                    </template>
                    <template v-else>
                        <label>Port:
                            <input type="number" v-model="additionalConfig.clientConfig.port">
                        </label>
                        <label>Trigger Script:
                            <input type="text" v-model="additionalConfig.clientConfig.triggerScriptCommand">
                        </label>
                    </template>
                    <label>Strength:
                        <input type="number" v-model="config.strength">
                    </label>
                    <label>Parallel Testcases:
                        <input type="number" v-model="config.parallelTestCases">
                    </label>
                </form>
            </main>
            <footer>
                <a href="" role="button" class="secondary" @click.prevent="$emit('close')">
                    Cancel
                </a>
                <a href="" role="button" @click.prevent="createJob" :aria-busy="waiting">
                    Create
                </a>
            </footer>
        </article>
    </dialog>
</template>

<script lang="ts">
import type { IAnvilWorker } from '@/lib/data_types';

export default {
    name: "NewJobDialog",
    props: ["workers", "workerId", "givenConfig", "givenAdditionalConfig"],
    emits: ["close"],
    data() {
        return {
            waiting: false,
            error: false,
            config: {
                testPackage: "de.rub.nds.tlstest.suite",
                identifier: "",
                strength: "1",
                parallelTestCases: "1",
                endpointMode: "SERVER"
            },
            additionalConfig: {
                clientConfig: {
                    port: 443,
                    triggerScriptCommand: ""
                },
                serverConfig: {
                    doNotSendSNIExtension: true,
                    sniHostname: "",
                    host: ""
                }
            },
            selectedWorker: this.workerId ? this.workerId : undefined,
            dlWorkers: [] as IAnvilWorker[],
        }
    },
    methods: {
        createJob() {
            this.waiting = true;
            this.error = false;

            this.$api.addJob(JSON.stringify(this.config), JSON.stringify(this.additionalConfig), this.selectedWorker)
                .then(() => {
                    this.waiting = false;
                    this.$emit("close");
                })
                .catch(() => {
                    this.error = true;
                    this.waiting = false;
                });
        }
    },
    created() {
        if (!this.workers) {
            this.$api.getWorkerList().then(workerList => this.dlWorkers = workerList);
        }
        if (this.givenConfig) {
            this.config = JSON.parse(this.givenConfig);
        }
        if (this.givenAdditionalConfig) {
            this.additionalConfig = JSON.parse(this.givenAdditionalConfig);
        }
    },
    computed: {
        getWorkers() {
            return this.workers ? this.workers : this.dlWorkers;
        }
    }
}
</script>

<style scoped>
h3 {
    margin-bottom: 0;
}
</style>