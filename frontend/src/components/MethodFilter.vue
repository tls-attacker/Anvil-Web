<template>
    <div class="grid">
        <input type="text" placeholder="Filter..." :value="filterText" @input="$emit('update:filterText', (<HTMLInputElement>$event.target).value)"/>
        <details>
            <summary role="button">Test Result</summary>
            <div>
                <label v-for="result of Object.keys(filteredResults)">
                    <input type="checkbox" :checked="filteredResults[result]" @change="updateResults(result, (<HTMLInputElement>$event.target).checked)"/>
                        {{ formatEnum(result) }}
                </label>
                <a href="" @click.prevent="resetResults()">Reset</a>
            </div>
        </details>
        <details>
            <summary role="button">Category</summary>
            <div>
                <label v-for="category of Object.keys(filteredCategories)">
                    <input type="checkbox" :checked="filteredCategories[category]" @change="updateCategories(category, (<HTMLInputElement>$event.target).checked)"/>
                        {{ formatEnum(category) }}
                </label>
                <a href="" @click.prevent="resetCategories()">Reset</a>
            </div>
        </details>
    </div>
</template>

<script lang="ts">
import { formatEnum } from '@/composables/visuals';
import { TestResult } from '@/lib/data_types';

export default {
    name: 'MethodFilter',
    props: ['filterText', 'filteredCategories', 'filteredResults'],
    emits: ['update:filterText', 'update:filteredCategories', 'update:filteredResults'],
    methods: {
        formatEnum,
        updateCategories(key: string, value: boolean) {
            let categories = this.filteredCategories
            categories[key] = value;
            this.$emit('update:filteredCategories', categories);
        },
        updateResults(key: string, value: boolean) {
            let results = this.filteredResults
            results[key] = value;
            this.$emit('update:filteredResults', results);
        },
        resetCategories() {
            this.$emit('update:filteredCategories', Object.fromEntries(this.$api.getScoreCategories().map(k => [k, true])));
        },
        resetResults() {
            let results = Object.fromEntries(Object.keys(TestResult).map(k => [k, true]));
            results["DISABLED"] = false;
            this.$emit('update:filteredResults', results);
        }
    },
    created() {
        this.resetCategories();
        this.resetResults();
    }

}
</script>