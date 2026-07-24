import { createApp } from 'vue'
import App from './App.vue'
import i18n from './locales'
import router from './router'
import { store } from '@inkcre/core'

// 样式
import 'uno.css'
import '@inkcre/web-design/styles'
import '@vue-flow/core/dist/style.css'

const app = createApp(App)

app.use(i18n)
app.use(store)
app.use(router)

// Initialize core package
import { initializeCore } from './core'
await initializeCore()
app.mount('#app')

// Initialize Extension
import { Extension } from '@inkcre/core'
Extension.startup().catch((error) => {
  console.error('[Extension] Startup failed:', error)
})

window.addEventListener('beforeunload', () => {
  void Extension.shutdown()
})
