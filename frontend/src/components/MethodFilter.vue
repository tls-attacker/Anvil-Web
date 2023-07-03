<template>
    <div class="grid">
        <input type="text" placeholder="Filter..." :value="filterText" @input="$emit('update:filterText', (<HTMLInputElement>$event.target).value)"/>
        <details>
            <summary role="button">Test Result</summary>
            <label v-for="outcome of Object.keys(filteredOutcomes)">
                <input type="checkbox" :checked="filteredOutcomes[outcome]" @change="updateOutcomes(outcome, (<HTMLInputElement>$event.target).checked)"/>
                    {{ formatEnum(outcome) }}
            </label>
            <a href="" @click.prevent="resetOutcomes()">Reset</a>
        </details>
        <details>
            <summary role="button">Category</summary>
            <label v-for="category of Object.keys(filteredCategories)">
                <input type="checkbox" :checked="filteredCategories[category]" @change="updateCategories(category, (<HTMLInputElement>$event.target).checked)"/>
                    {{ formatEnum(category) }}
            </label>
            <a href="" @click.prevent="resetCategories()">Reset</a>
        </details>
    </div>
</template>

<script lang="ts">
import { formatEnum } from '@/composables/visuals';
import { ScoreCategories, TestOutcome } from '@/lib/data_types';

export default {
    name: 'MethodFilter',
    props: ['filterText', 'filteredCategories', 'filteredOutcomes'],
    emits: ['update:filterText', 'update:filteredCategories', 'update:filteredOutcomes'],
    methods: {
        formatEnum,
        updateCategories(key: string, value) {
            let categories = this.filteredCategories
            categories[key] = value;
            this.$emit('update:filteredCategories', categories);
        },
        updateOutcomes(key: string, value) {
            let outcomes = this.filteredOutcomes
            outcomes[key] = value;
            this.$emit('update:filteredOutcomes', outcomes);
        },
        resetCategories() {
            this.$emit('update:filteredCategories', Object.fromEntries(Object.keys(ScoreCategories).map(k => [k, true])));
        },
        resetOutcomes() {
            this.$emit('update:filteredOutcomes', Object.fromEntries(Object.keys(TestOutcome).map(k => [k, true])));
        }
    },
    created() {
        this.resetCategories();
        this.resetOutcomes();
    }

}
</script>