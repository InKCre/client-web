import { createApp } from 'vue'
import { createInstance } from '@module-federation/runtime'

import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'

// 导入全局样式
import '@/styles/index.scss'
import 'uno.css'
import store from './stores'

const app = createApp(App)

app.use(VueKonva)

app.use(store)
app.use(router)

createInstance({
    name: 'host',
    remotes: [
    ],
});

app.mount('#app');
