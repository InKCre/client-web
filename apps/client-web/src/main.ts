import { createApp } from 'vue'
import App from './App.vue'
import i18n from './locales'
import router from './router'
import { setInfoBaseRouter, store } from '@inkcre/core'
import { createInfoBaseRouterAdapter } from './router'

// 样式
import 'uno.css'
import '@inkcre/ui-web/styles'
import '@vue-flow/core/dist/style.css'

const app = createApp(App)

app.use(i18n)
app.use(store)
app.use(router)
setInfoBaseRouter(createInfoBaseRouterAdapter(router))

// Initialize core package
import { initializeCore, shutdownCore } from './core'
await initializeCore()
app.mount('#app')

// Initialize Extension
import { Extension } from '@inkcre/core'
Extension.startup().catch((error) => {
  console.error('[Extension] Startup failed:', error)
})

window.addEventListener('beforeunload', () => {
  shutdownCore()
  void Extension.shutdown()
})
