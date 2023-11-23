<template>
    <dialog open v-if="testCase">
        <article>
            <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')"></a>
                Test Case Details
            </header>
            <main>
                <p><strong>UUID: </strong>{{ testCase.uuid }}</p>
                <p><strong>Result: </strong>{{ testCase.Result }}</p>
                <p><strong>SrcPort: </strong>{{ testCase.SrcPort }}</p>
                <p><strong>DstPort: </strong>{{ testCase.DstPort }}</p>
                <p><strong>Start: </strong>{{ testCase.StartTimestamp }}</p>
                <p><strong>End: </strong>{{ testCase.EndTimestamp }}</p>
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
                <p>
                    <strong>Derivations:</strong>
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
                </p>
                <p>
                    <strong>Network Traffic Capture</strong> <br>
                    <pre>{{ traffic }}</pre>
                    <a :href="$api.getPcapDownloadLink($route.params.identifier as string, $route.params.testId as string, testCase.uuid)" role="button" target="_blank" download="capture.pcap">Download PCAP</a>
                </p>
            </main>
        </article>
    </dialog>
</template>

<script lang="ts">
export default {
    name: "TestCaseModal",
    props: ["testCase"],
    emits: ["close"],
    data() {
        return {
            traffic: ""
        }
    },
    watch: {
        testCase() {
            if (this.testCase) {
                this.$api.getTrafficOverview(this.$route.params.identifier as string, this.$route.params.testId as string, this.testCase.uuid)
                .then((text) => {
                    this.traffic = text.trim();
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

th {
    font-weight: bold;
    background-color: rgb(209, 209, 209);
}

p {
    margin-bottom: 10px;
}</style>