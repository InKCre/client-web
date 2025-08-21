import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'

// 导入全局样式
import '@/styles/main.scss'

const app = createApp(App)

app.use(VueKonva)

app.use(createPinia())
app.use(router)

app.mount('#app')
