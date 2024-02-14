import '@picocss/pico/css/pico.css'
import './assets/custom.css'

import { createApp, type Ref } from 'vue'
import StaticReport from './StaticReport.vue'
import { AnvilApi } from './api'
import { createRouter, createWebHistory } from 'vue-router'

const app = createApp(StaticReport)
app.use(createRouter({history: createWebHistory(), routes: []}))
app.config.globalProperties.$api = AnvilApi;
app.mount('#app');
declare type AnvilApiI = typeof AnvilApi;
declare module 'vue' {
    interface ComponentCustomProperties {
      $api: AnvilApiI;
      $time: Ref<number>;
    }
}