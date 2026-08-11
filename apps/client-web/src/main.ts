import { createApp } from 'vue'
import App from './App.vue'
import i18n from './locales'
import router from './router'
import { store } from '@inkcre/core'

// 样式
import 'uno.css'
import '@inkcre/ui-web/styles'
import '@vue-flow/core/dist/style.css'

const app = createApp(App)

app.use(i18n)
app.use(store)
app.use(router)

// Initialize core package
import { initializeCore } from './core'
await initializeCore()
app.mount('#app')

import { getExtensionHost } from './core'
const extensionHost = getExtensionHost()
extensionHost.startup().catch((error) => {
  console.error('[Web Extension Host] Startup failed:', error)
})

window.addEventListener('beforeunload', () => {
  void extensionHost.shutdown()
})
