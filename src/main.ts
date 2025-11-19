import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createInstance } from '@module-federation/runtime'

import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'
import { initAppConfig } from '@/config'

// 导入全局样式
import '@/styles/main.scss'

const app = createApp(App)

app.use(VueKonva)

app.use(createPinia())
app.use(router)

initAppConfig().then(() => {
    createInstance({
        name: 'host',
        remotes: [
        ],
    });
})

app.mount('#app');
