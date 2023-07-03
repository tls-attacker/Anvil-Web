import '@picocss/pico/css/pico.css'
import './assets/custom.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { AnvilApi } from './api'

const app = createApp(App)

app.use(router)
app.config.globalProperties.$api = AnvilApi;
app.mount('#app')

declare type AnvilApiI = typeof AnvilApi;
declare module 'vue' {
    interface ComponentCustomProperties {
      $api: AnvilApiI;
    }
}