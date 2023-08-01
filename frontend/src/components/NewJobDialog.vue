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
                        <input type="text" placeholder="example-test" v-model="identifier">
                    </label>
                    <label>Testmode:
                        <select v-model="testmode">
                            <option value="server">Server</option>
                            <option value="client">Client</option>
                        </select>
                    </label>
                    <template v-if="testmode=='server'">
                        <label>Server:
                            <input type="text" placeholder="testserver:443" v-model="serverHost">
                        </label>
                        <label>
                            <input type="checkbox" v-model="sendSNI">
                            Send SNI Extension
                        </label>
                        <label v-if="sendSNI">Server Name (SNI):
                            <input type="text" v-model="sniName">
                        </label>
                    </template>
                    <template v-else>
                        <label>Port:
                            <input type="number" v-model="clientPort">
                        </label>
                        <label>Trigger Script:
                            <input type="text" v-model="triggerScript">
                        </label>
                    </template>
                    <label>Strength:
                        <input type="number" v-model="strength">
                    </label>
                    <label>Parallel Testcases:
                        <input type="number" v-model="parallelTestcases">
                    </label>
                    <label>Additional config:
                        <input type="text" v-model="config">
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
    props: ["open", "workers", "workerId", "givenConfig"],
    emits: ["close"],
    data() {
        return {
            waiting: false,
            error: false,
            config: "",
            testmode: "server",
            sendSNI: false,
            sniName: "",
            selectedWorker: this.workerId ? this.workerId : undefined,
            serverHost: "",
            clientPort: 443,
            triggerScript: "",
            identifier: "",
            dlWorkers: [] as IAnvilWorker[],
            strength: "1",
            parallelTestcases: "1"
        }
    },
    methods: {
        createJob() {
            this.waiting = true;
            this.error = false;

            let command = this.config;
            if (this.identifier.length>0) {
                command += ` -identifier ${this.identifier}`;
            }
            command += ` -strength ${this.strength} -parallelHandshakes ${this.parallelTestcases} ${this.testmode}`;
            if (this.testmode == 'server') {
                command += ` -connect ${this.serverHost}`;
                if (this.sendSNI) {
                    if (this.sniName.length>0) {
                        command += ` -server_name ${this.sniName}`;
                    }
                } else {
                    command += " -doNotSendSNIExtension";
                }
            } else {
                command += ` -port ${this.clientPort}`;
                if (this.triggerScript.length>0) {
                    command += ` -triggerScript ${this.triggerScript}`;
                }
            }

            this.$api.addJob(command.trim(), this.selectedWorker)
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
            this.config = this.givenConfig;
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