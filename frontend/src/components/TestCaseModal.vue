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
                    <p v-if="testCase.AdditionalResultInformation"><strong>AdditionalResultInformation: </strong>{{ testCase.AdditionalResultInformation }}</p>
                    <p v-if="testCase.AdditionalTestInformation"><strong>AdditionalTestInformation: </strong>{{ testCase.AdditionalTestInformation }}</p>
                    <p><strong>Derivations:</strong>
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
                </main>
            </article>
        </dialog>
</template>

<script lang="ts">
export default {
    name: "TestCaseModal",
    props: ["testCase"],
    emits: ["close"]
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
}
</style>