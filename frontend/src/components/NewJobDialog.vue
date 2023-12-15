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
                            <input type="text" v-model="additionalConfig.clientConfig.triggerScriptCommand[0]">
                        </label>
                    </template>
                    <label>Strength:
                        <input type="number" v-model="config.strength" min="1">
                    </label>
                    <label>Parallel Testcases:
                        <input type="number" v-model="config.parallelTestCases" min="1">
                    </label>
                    <details>
                        <summary>More settings</summary>
                        <label>Connection Timeout (ms)
                            <input type="number" v-model="config.connectionTimeout" min="100" step="100">
                        </label>
                        <label>Don't capture network traffic
                            <input type="checkbox" role="switch" v-model="config.disableTcpDump">
                        </label>
                        <label>DTLS
                            <input type="checkbox" role="switch" v-model="config.useDTLS">
                        </label>
                        <label>Ignore cache
                            <input type="checkbox" role="switch" v-model="config.ignoreCache">
                        </label>
                        <label>Restart target after ... failed attempts
                            <input type="number" min="0" step="100" v-model="config.restartServerAfter">
                        </label>
                        <label>Tags
                            <input type="text" v-model="config.tags">
                        </label>
                        <label>Testpackage
                            <input type="text" v-model="config.testPackage">
                        </label>
                    </details>
                </form>
            </main>
            <footer>
                <a href="" role="button" class="secondary" @click.prevent="$emit('close')">
                    Cancel
                </a>
                <a href="" role="button" @click.prevent="createJob" :aria-busy="waiting" :disabled="validateForm()">
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
                connectionTimeout: "200",
                disableTcpDump: "true",
                useDTLS: "false",
                identifier: "new_test_"+Math.floor(Math.random()*100),
                ignoreCache: "false",
                //networkInterface: "\\Device\\NPF_Loopback",
                parallelTestCases: "1",
                //parallelTests: "1",
                restartServerAfter: "0",
                strength: "1",
                tags: "",
                testPackage: "de.rub.nds.tlstest.suite",
                endpointMode: "SERVER"
            },
            additionalConfig: {
                clientConfig: {
                    port: 443,
                    triggerScriptCommand: [""]
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

            let modifiedConfig = JSON.parse(JSON.stringify(this.config));
            if (modifiedConfig.tags.length > 0) {
                modifiedConfig.tags = modifiedConfig.tags.split(" ");
            } else {
                modifiedConfig.tags = [];
            }
            console.log(modifiedConfig);

            this.$api.addJob(JSON.stringify(modifiedConfig), JSON.stringify(this.additionalConfig), this.selectedWorker)
                .then(() => {
                    this.waiting = false;
                    this.$emit("close");
                })
                .catch(() => {
                    this.error = true;
                    this.waiting = false;
                });
        },
        validateForm() {
            const idReg = /^[a-zA-Z0-9\-_:.]+$/;
            return idReg.test(this.config.identifier) ? null : true;
        }
    },
    created() {
        if (!this.workers) {
            this.$api.getWorkerList().then(workerList => this.dlWorkers = workerList);
        }
        if (this.givenConfig) {
            // update config with entries from the given config
            let configUpdates = JSON.parse(this.givenConfig);
            if (Array.isArray(configUpdates.tags)) {
                configUpdates.tags = configUpdates.tags.join(" ");
            }
            Object.keys(this.config).forEach((key) => {
                if(key in configUpdates){
                    // @ts-ignore
                    this.config[key] = configUpdates[key];
                }
            });
        }
        if (this.givenAdditionalConfig) {
            let configUpdates = JSON.parse(this.givenAdditionalConfig);
            Object.keys(this.additionalConfig).forEach((key) => {
                if(key in configUpdates){
                    // @ts-ignore
                    this.additionalConfig[key] = configUpdates[key]
                }
            });
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