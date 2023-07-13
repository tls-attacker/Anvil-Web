import '@picocss/pico/css/pico.css'
import './assets/custom.css'

import { createApp, type Ref } from 'vue'
import App from './App.vue'
import router from './router'
import { AnvilApi } from './api'
import { ref } from 'vue'

const app = createApp(App)

app.use(router)
app.config.globalProperties.$api = AnvilApi;
app.config.globalProperties.$time = ref(Date.now());
setInterval(() => app.config.globalProperties.$time.value += 1000, 1000);
app.mount('#app');

declare type AnvilApiI = typeof AnvilApi;
declare module 'vue' {
    interface ComponentCustomProperties {
      $api: AnvilApiI;
      $time: Ref<number>;
    }
}