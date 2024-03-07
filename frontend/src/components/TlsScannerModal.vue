<template>
    <dialog open v-if="scannerReport">
            <article>
                <header>
                <a href="" aria-label="Close" class="close" @click.prevent="$emit('close')"></a>
                Tls Scanner Report
                </header>
                <main>
                    <div v-html="html"></div>
                </main>
            </article>
        </dialog>
</template>

<script lang="ts">
import { AnsiUp } from "ansi_up";

export default {
    name: "TlsScannerModal",
    props: ["scannerReport"],
    emits: ["close"],
    data() {
        return {
            html: new AnsiUp().ansi_to_html(this.scannerReport).replaceAll("\n", "<br>")
        }
    }
}
</script>

<style scoped>
article {
    max-width: 1000px;
}
header {
    margin-bottom: 1rem;
}
</style>