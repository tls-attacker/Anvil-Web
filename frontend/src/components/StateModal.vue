<template>
    <dialog open v-if="state">
            <article>
                <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')"></a>
                {{ state.uuid }}
                </header>
                <main>
                    <p><strong>Result: </strong>{{ state.Result }}</p>
                    <p><strong>SrcPort: </strong>{{ state.SrcPort }}</p>
                    <p><strong>DstPort: </strong>{{ state.DstPort }}</p>
                    <p><strong>Start: </strong>{{ state.StartTimestamp }}</p>
                    <p><strong>End: </strong>{{ state.EndTimestamp }}</p>
                    <p v-if="state.AdditionalResultInformation"><strong>AdditionalResultInformation: </strong>{{ state.AdditionalResultInformation }}</p>
                    <p v-if="state.AdditionalTestInformation"><strong>AdditionalTestInformation: </strong>{{ state.AdditionalTestInformation }}</p>
                    <p><strong>Derivations:</strong>
                    <table role="grid">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Derivation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(derivation, parameter) of state.DerivationContainer">
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
    name: "StateModal",
    props: ["state"],
    emits: ["close"]
}
</script>

<style scoped>
td {
    word-break: break-all;
}
</style>