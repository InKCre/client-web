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

// Registry lifecycle restores only persisted bindings for this current peer.
// The legacy `Extension` adapter is intentionally not booted during migration.
import { registryExtensions } from '@inkcre/core'
registryExtensions.startup().catch((error) => {
  console.error('[Registry Extension] Startup failed:', error)
})

window.addEventListener('beforeunload', () => {
  void registryExtensions.shutdown()
})
