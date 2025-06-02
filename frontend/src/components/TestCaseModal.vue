<template>
    <dialog open v-if="testCase">
        <article>
            <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')"></a>
                Test Case Details
            </header>
            <main>
                <table>
                    <tr>
                        <td><strong>UUID: </strong></td>
                        <td colspan=3>{{ testCase.uuid }}</td>
                    </tr>
                    <tr>
                        <td><strong>Result: </strong></td>
                        <td colspan=3>{{ getResultSymbolsTestCase(testCase) }} {{ formatEnum(testCase.Result) }}</td>
                    </tr>
                    <tr>
                        <td><strong>SrcPort: </strong></td>
                        <td>{{ testCase.SrcPort }}</td>
                        <td><strong>DstPort: </strong></td>
                        <td>{{ testCase.DstPort }}</td>
                    </tr>
                    <tr>
                        <td><strong>Start: </strong></td>
                        <td>{{ $api.formatDate(testCase.StartTimestamp) }}</td>
                        <td><strong>End: </strong></td>
                        <td>{{ $api.formatDate(testCase.EndTimestamp) }}</td>
                    </tr>
                </table>
                <p v-if="testCase.Stacktrace">
                    <strong>Stacktrace:</strong>
                    <code>{{ testCase.Stacktrace }}</code>
                </p>
                <p v-if="testCase.AdditionalResultInformation"><strong>AdditionalResultInformation: </strong>
                <ul>
                    <li v-for="ari of testCase.AdditionalResultInformation"> {{ ari }}</li>
                </ul>
                </p>
                <p v-if="testCase.AdditionalTestInformation">
                    <strong>AdditionalTestInformation: </strong>
                    <ul>
                        <li v-for="ati of testCase.AdditionalTestInformation"> {{ ati }}</li>
                    </ul>
                </p>
                <details>
                    <summary><strong>Derivations</strong></summary>
                    <table role="grid">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Derivation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(derivation, parameter) of testCase.ParameterCombination">
                                <td>{{ parameter }}</td>
                                <td>{{ derivation }}</td>
                            </tr>
                        </tbody>
                    </table>
                </details>
                <p>
                    <strong>Network Traffic Capture</strong> <br>
                    <pre><span v-for="line of traffic" :class="{
                        'traffic-tcp': (line.includes('SYN') || line.includes('FIN') || line.includes('ACK')),
                        'traffic-tls': (line.includes('TLS') || line.includes('SSL')),
                        'traffic-http': (line.includes('HTTP')),
                        'traffic-rts': (line.includes('RTS'))
                    }">{{ line }}<br></span></pre>
                    <a :href="$api.getPcapDownloadLink(identifier,testId, testCase.uuid)" role="button" target="_blank" download="capture.pcap">Download PCAP</a>
                </p>
            </main>
        </article>
    </dialog>
</template>

<script lang="ts">
import { formatEnum, getResultSymbolsTestCase } from '@/composables/visuals';
export default {
    name: "TestCaseModal",
    props: ["testCase", "identifier", "testId"],
    emits: ["close"],
    data() {
        return {
            traffic: [] as string[]
        }
    },
    methods: {
        getResultSymbolsTestCase,
        formatEnum
    },
    watch: {
        testCase() {
            if (this.testCase) {
                this.$api.getTrafficOverview(this.identifier, this.testId, this.testCase.uuid)
                .then((text) => {
                    this.traffic = text.split("\n");
                });
            }
        }
    },
}
</script>

<style scoped>
td {
    word-break: break-all;
}

article {
    max-width: 1000px;
}

header {
    margin-bottom: 0;
}

th {
    font-weight: bold;
    background-color: rgb(209, 209, 209);
}

p {
    margin-bottom: 10px;
}

.traffic-tcp {
    color: rgb(146, 146, 146);
}
.traffic-tls {
    color: blue;
}
.traffic-http {
    color: green;
}
.traffic-rts {
    color: red;
}

</style>